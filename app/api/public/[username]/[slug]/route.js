import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const publicBookingSchema = z.object({
  attendeeName: z.string().min(1, 'Name is required'),
  attendeeEmail: z.string().email('Invalid email address'),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
})

export async function GET(request, { params }) {
  try {
    const { username, slug } = params

    // Get user and event type
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        timezone: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug,
        isActive: true
      }
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Get user's availability for this event type
    const availability = await prisma.availability.findMany({
      where: {
        userId: user.id,
        eventTypeId: eventType.id
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Get existing bookings for the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        eventTypeId: eventType.id,
        startTime: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    return NextResponse.json({
      user,
      eventType,
      availability,
      existingBookings
    })
  } catch (error) {
    console.error('Error fetching public event data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { username, slug } = params
    const body = await request.json()
    const validatedData = publicBookingSchema.parse(body)

    // Get user and event type
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug,
        isActive: true
      }
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Check for time conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        eventTypeId: eventType.id,
        status: {
          not: 'CANCELLED'
        },
        OR: [
          {
            startTime: {
              lt: new Date(validatedData.endTime),
              gte: new Date(validatedData.startTime)
            }
          },
          {
            endTime: {
              gt: new Date(validatedData.startTime),
              lte: new Date(validatedData.endTime)
            }
          }
        ]
      }
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        title: eventType.title,
        description: eventType.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        attendeeName: validatedData.attendeeName,
        attendeeEmail: validatedData.attendeeEmail,
        attendeePhone: validatedData.attendeePhone,
        notes: validatedData.notes,
        eventTypeId: eventType.id,
        userId: user.id,
        status: 'CONFIRMED'
      }
    })

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating public booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
