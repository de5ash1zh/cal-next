import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const eventTypeId = searchParams.get('eventTypeId')

    if (!date || !eventTypeId) {
      return NextResponse.json(
        { error: 'Date and eventTypeId are required' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    // Get event type details
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { duration: true, userId: true }
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Get user's availability for this day
    const availability = await prisma.availability.findMany({
      where: {
        userId: eventType.userId,
        dayOfWeek: dayOfWeek,
        OR: [
          { eventTypeId: null }, // General availability
          { eventTypeId: eventTypeId } // Event-specific availability
        ]
      },
      orderBy: { startTime: 'asc' }
    })

    if (availability.length === 0) {
      return NextResponse.json([])
    }

    // Get existing bookings for this date
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: eventType.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // Get blocked times for this date
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        userId: eventType.userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // Generate time slots
    const timeSlots = []
    const slotDuration = 30 // 30-minute intervals

    availability.forEach(avail => {
      const startTime = new Date(`2000-01-01T${avail.startTime}`)
      const endTime = new Date(`2000-01-01T${avail.endTime}`)
      
      let currentTime = new Date(startTime)
      
      while (currentTime < endTime) {
        const slotStart = new Date(selectedDate)
        slotStart.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0)
        
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + eventType.duration)
        
        // Check if slot conflicts with existing bookings
        const hasBookingConflict = existingBookings.some(booking => {
          return (
            (slotStart < booking.endTime && slotEnd > booking.startTime) ||
            (slotStart >= booking.startTime && slotStart < booking.endTime) ||
            (slotEnd > booking.startTime && slotEnd <= booking.endTime)
          )
        })
        
        // Check if slot conflicts with blocked times
        const hasBlockedConflict = blockedTimes.some(blocked => {
          return (
            (slotStart < blocked.endTime && slotEnd > blocked.startTime) ||
            (slotStart >= blocked.startTime && slotStart < blocked.endTime) ||
            (slotEnd > blocked.startTime && slotEnd <= blocked.endTime)
          )
        })
        
        if (!hasBookingConflict && !hasBlockedConflict) {
          timeSlots.push({
            time: currentTime.toTimeString().slice(0, 5),
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString()
          })
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration)
      }
    })

    // Sort time slots
    timeSlots.sort((a, b) => a.time.localeCompare(b.time))

    return NextResponse.json(timeSlots)
  } catch (error) {
    console.error('Error fetching availability slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
