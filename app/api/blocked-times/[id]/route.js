import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const blockedTimeUpdateSchema = z.object({
  startTime: z.string().datetime('Start time must be a valid date').optional(),
  endTime: z.string().datetime('End time must be a valid date').optional(),
  reason: z.string().min(1, 'Reason is required').optional()
})

export async function PUT(request, { params }) {
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

    const { id } = params
    const body = await request.json()
    const validatedData = blockedTimeUpdateSchema.parse(body)

    // Check if blocked time exists and belongs to user
    const existingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingBlockedTime) {
      return NextResponse.json({ error: 'Blocked time not found' }, { status: 404 })
    }

    // Check for time conflicts if updating time
    if (validatedData.startTime || validatedData.endTime) {
      const startTime = validatedData.startTime || existingBlockedTime.startTime
      const endTime = validatedData.endTime || existingBlockedTime.endTime

      const conflictingBlockedTime = await prisma.blockedTime.findFirst({
        where: {
          userId: user.id,
          id: { not: id },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      })

      if (conflictingBlockedTime) {
        return NextResponse.json({ error: 'Time slot conflicts with existing blocked time' }, { status: 400 })
      }
    }

    const updatedBlockedTime = await prisma.blockedTime.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(updatedBlockedTime)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Error updating blocked time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = params

    // Check if blocked time exists and belongs to user
    const existingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingBlockedTime) {
      return NextResponse.json({ error: 'Blocked time not found' }, { status: 404 })
    }

    await prisma.blockedTime.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Blocked time deleted successfully' })
  } catch (error) {
    console.error('Error deleting blocked time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
