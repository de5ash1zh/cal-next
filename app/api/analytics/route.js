import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

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
    const timeRange = parseInt(searchParams.get('timeRange') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Get all bookings for the user in the time range
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        eventType: {
          select: {
            title: true,
            duration: true,
            price: true
          }
        }
      }
    })

    // Calculate basic metrics
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length
    
    // Calculate revenue
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.eventType.price || 0)
    }, 0)

    // Calculate average booking duration
    const totalDuration = bookings.reduce((sum, booking) => {
      return sum + (booking.eventType.duration || 0)
    }, 0)
    const averageBookingDuration = totalBookings > 0 ? Math.round(totalDuration / totalBookings) : 0

    // Calculate conversion rate
    const conversionRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0

    // Get top event types by booking count
    const eventTypeStats = await prisma.booking.groupBy({
      by: ['eventTypeId'],
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })

    const topEventTypes = await Promise.all(
      eventTypeStats.map(async (stat) => {
        const eventType = await prisma.eventType.findUnique({
          where: { id: stat.eventTypeId },
          select: { title: true, duration: true }
        })
        return {
          id: stat.eventTypeId,
          title: eventType?.title || 'Unknown',
          duration: eventType?.duration || 0,
          bookingCount: stat._count.id
        }
      })
    )

    // Get daily booking trends
    const dailyBookings = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format daily bookings data
    const formattedDailyBookings = dailyBookings.map(day => ({
      date: day.createdAt.toISOString().split('T')[0],
      count: day._count.id
    }))

    return NextResponse.json({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      averageBookingDuration,
      topEventTypes,
      dailyBookings: formattedDailyBookings,
      conversionRate
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
