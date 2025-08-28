import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime('Start time must be a valid date'),
  endTime: z.string().datetime('End time must be a valid date'),
  attendeeName: z.string().min(1, 'Attendee name is required'),
  attendeeEmail: z.string().email('Valid email is required'),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
  eventTypeId: z.string().min(1, 'Event type is required'),
  customFieldValues: z.array(z.object({
    customFieldId: z.string(),
    value: z.string()
  })).optional()
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
            duration: true,
            price: true,
            color: true
          }
        },
        customFieldValues: {
          include: {
            customField: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'desc'
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

    // Verify event type exists and belongs to the user
    const eventType = await prisma.eventType.findFirst({
      where: {
        id: validatedData.eventTypeId,
        userId: session.user.id
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
        userId: session.user.id,
        eventTypeId: validatedData.eventTypeId,
        status: {
          notIn: ['CANCELLED']
        },
        OR: [
          {
            startTime: {
              lt: validatedData.endTime,
              gte: validatedData.startTime
            }
          },
          {
            endTime: {
              gt: validatedData.startTime,
              lte: validatedData.endTime
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

    // Generate meeting links if configured
    let zoomUrl = null
    let googleMeetUrl = null

    if (eventType.zoomMeeting && eventType.zoomUrl) {
      const meetingId = Math.random().toString(36).substring(2, 15)
      zoomUrl = eventType.zoomUrl.replace('{meetingId}', meetingId)
    }

    if (eventType.googleMeet && eventType.googleMeetUrl) {
      const meetingId = Math.random().toString(36).substring(2, 15)
      googleMeetUrl = eventType.googleMeetUrl.replace('{meetingId}', meetingId)
    }

    // Create booking with custom fields
    const booking = await prisma.booking.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        attendeeName: validatedData.attendeeName,
        attendeeEmail: validatedData.attendeeEmail,
        attendeePhone: validatedData.attendeePhone,
        notes: validatedData.notes,
        eventTypeId: validatedData.eventTypeId,
        userId: session.user.id,
        zoomUrl,
        googleMeetUrl,
        customFieldValues: {
          create: validatedData.customFieldValues?.map(field => ({
            value: field.value,
            customFieldId: field.customFieldId
          })) || []
        }
      },
      include: {
        eventType: {
          select: {
            title: true,
            duration: true,
            price: true,
            color: true
          }
        },
        customFieldValues: {
          include: {
            customField: {
              select: {
                name: true,
                type: true
              }
            }
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
