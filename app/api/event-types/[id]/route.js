import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventTypeUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    const eventType = await prisma.eventType.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(eventType)
  } catch (error) {
    console.error('Error fetching event type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const validatedData = eventTypeUpdateSchema.parse(body)

    // Check if slug already exists for this user (if slug is being updated)
    if (validatedData.slug) {
      const existingEventType = await prisma.eventType.findFirst({
        where: {
          userId: session.user.id,
          slug: validatedData.slug,
          id: { not: id }
        }
      })

      if (existingEventType) {
        return NextResponse.json(
          { error: 'An event type with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const eventType = await prisma.eventType.update({
      where: {
        id,
        userId: session.user.id
      },
      data: validatedData
    })

    return NextResponse.json(eventType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating event type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if event type has any bookings
    const existingBookings = await prisma.booking.findFirst({
      where: {
        eventTypeId: id
      }
    })

    if (existingBookings) {
      return NextResponse.json(
        { error: 'Cannot delete event type with existing bookings' },
        { status: 400 }
      )
    }

    await prisma.eventType.delete({
      where: {
        id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Event type deleted successfully' })
  } catch (error) {
    console.error('Error deleting event type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
