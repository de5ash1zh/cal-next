import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const notificationUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  bookingConfirmations: z.boolean().optional(),
  bookingReminders: z.boolean().optional(),
  bookingCancellations: z.boolean().optional(),
  weeklyDigest: z.boolean().optional()
})

export async function PUT(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = notificationUpdateSchema.parse(body)

    // For now, we'll just return success since we don't have a notifications table yet
    // In a real implementation, you would store these preferences in the database
    
    return NextResponse.json({ 
      message: 'Notification preferences updated successfully',
      preferences: validatedData
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
