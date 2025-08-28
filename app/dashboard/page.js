'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, TrendingUp, Plus, ExternalLink } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    totalEventTypes: 0,
    activeEventTypes: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats and recent bookings
      const [bookingsRes, eventTypesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/event-types')
      ])

      if (bookingsRes.ok && eventTypesRes.ok) {
        const [bookings, eventTypes] = await Promise.all([
          bookingsRes.json(),
          eventTypesRes.json()
        ])

        const now = new Date()
        const upcomingBookings = bookings.filter(booking => 
          new Date(booking.startTime) > now && booking.status === 'CONFIRMED'
        )

        setStats({
          totalBookings: bookings.length,
          upcomingBookings: upcomingBookings.length,
          totalEventTypes: eventTypes.length,
          activeEventTypes: eventTypes.filter(et => et.isActive).length
        })

        setRecentBookings(bookings.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">
                Confirmed upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Types</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEventTypes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEventTypes} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalBookings > 0 ? Math.round((stats.upcomingBookings / stats.totalBookings) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Upcoming vs total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Get started quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/event-types/new">
                <Button className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event Type
                </Button>
              </Link>
              <Link href="/dashboard/bookings/new">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </Link>
              <Link href="/dashboard/availability">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Set Availability
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>Your latest appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{booking.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.startTime).toLocaleDateString()} at{' '}
                          {new Date(booking.startTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.attendeeName} • {booking.attendeeEmail}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentBookings.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href="/dashboard/bookings">
                    <Button variant="outline">View All Bookings</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Public Profile Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Public Profile</CardTitle>
            <CardDescription>Share this link with others to let them book with you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                {typeof window !== 'undefined' ? `${window.location.origin}/${session?.user?.username}` : ''}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/${session?.user?.username}`)
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
