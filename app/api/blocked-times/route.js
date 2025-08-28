import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const blockedTimeSchema = z.object({
  startTime: z.string().datetime('Start time must be a valid date'),
  endTime: z.string().datetime('End time must be a valid date'),
  reason: z.string().min(1, 'Reason is required')
})

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const blockedTimes = await prisma.blockedTime.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(blockedTimes)
  } catch (error) {
    console.error('Error fetching blocked times:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = blockedTimeSchema.parse(body)

    // Check for time conflicts
    const conflictingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        userId: user.id,
        OR: [
          {
            AND: [
              { startTime: { lte: validatedData.startTime } },
              { endTime: { gt: validatedData.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: validatedData.endTime } },
              { endTime: { gte: validatedData.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: validatedData.startTime } },
              { endTime: { lte: validatedData.endTime } }
            ]
          }
        ]
      }
    })

    if (conflictingBlockedTime) {
      return NextResponse.json({ error: 'Time slot conflicts with existing blocked time' }, { status: 400 })
    }

    const blockedTime = await prisma.blockedTime.create({
      data: {
        ...validatedData,
        userId: user.id
      }
    })

    return NextResponse.json(blockedTime, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Error creating blocked time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
