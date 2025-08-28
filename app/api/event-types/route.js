import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventTypeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
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

    const eventTypes = await prisma.eventType.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error('Error fetching event types:', error)
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
    const validatedData = eventTypeSchema.parse(body)

    // Check if slug already exists for this user
    const existingEventType = await prisma.eventType.findFirst({
      where: {
        userId: session.user.id,
        slug: validatedData.slug
      }
    })

    if (existingEventType) {
      return NextResponse.json(
        { error: 'An event type with this slug already exists' },
        { status: 400 }
      )
    }

    const eventType = await prisma.eventType.create({
      data: {
        ...validatedData,
        userId: session.user.id
      }
    })

    return NextResponse.json(eventType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating event type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
