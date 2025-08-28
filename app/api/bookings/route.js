import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  attendeeName: z.string().min(1, 'Attendee name is required'),
  attendeeEmail: z.string().email('Invalid attendee email'),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
  eventTypeId: z.string().min(1, 'Event type is required'),
})

export async function GET(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventTypeId = searchParams.get('eventTypeId')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where = {
      userId: session.user.id
    }

    if (status) {
      where.status = status
    }

    if (eventTypeId) {
      where.eventTypeId = eventTypeId
    }

    if (upcoming) {
      where.startTime = {
        gte: new Date()
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        eventType: {
          select: {
            title: true,
            color: true,
            duration: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Verify event type exists and belongs to user
    const eventType = await prisma.eventType.findFirst({
      where: {
        id: validatedData.eventTypeId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found or inactive' },
        { status: 404 }
      )
    }

    // Check for time conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
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
        { error: 'Time slot conflicts with existing booking' },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime)
      },
      include: {
        eventType: {
          select: {
            title: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
      )
  }
}
