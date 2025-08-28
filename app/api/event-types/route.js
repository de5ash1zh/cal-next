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
  isActive: z.boolean().default(true),
  color: z.string().default('#6b7280'),
  zoomMeeting: z.boolean().default(false),
  googleMeet: z.boolean().default(false),
  zoomUrl: z.string().optional(),
  googleMeetUrl: z.string().optional(),
  customFields: z.array(z.object({
    name: z.string().min(1, 'Field name is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'RADIO', 'CHECKBOX', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'TIME']),
    required: z.boolean().default(false),
    options: z.string().optional(),
    order: z.number().default(0)
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

    const eventTypes = await prisma.eventType.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        customFields: {
          orderBy: {
            order: 'asc'
          }
        }
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

    // Check if slug is unique for this user
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

    // Create event type with custom fields
    const eventType = await prisma.eventType.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description,
        duration: validatedData.duration,
        price: validatedData.price || 0,
        isActive: validatedData.isActive,
        color: validatedData.color,
        zoomMeeting: validatedData.zoomMeeting,
        googleMeet: validatedData.googleMeet,
        zoomUrl: validatedData.zoomUrl,
        googleMeetUrl: validatedData.googleMeetUrl,
        userId: session.user.id,
        customFields: {
          create: validatedData.customFields?.map((field, index) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            options: field.options,
            order: field.order || index,
            userId: session.user.id
          })) || []
        }
      },
      include: {
        customFields: {
          orderBy: {
            order: 'asc'
          }
        }
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
