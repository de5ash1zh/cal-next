'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, TrendingUp, Plus, ExternalLink, ArrowRight } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'
import { toast } from 'sonner'

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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session?.user?.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalBookings}</div>
              <p className="text-xs text-gray-500 mt-1">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</div>
              <p className="text-xs text-gray-500 mt-1">
                Confirmed upcoming
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Event Types</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalEventTypes}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeEventTypes} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalBookings > 0 ? Math.round((stats.upcomingBookings / stats.totalBookings) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upcoming vs total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Bookings */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">Get started quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/event-types/new">
                <Button className="w-full justify-start bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event Type
                </Button>
              </Link>
              <Link href="/dashboard/bookings/new">
                <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </Link>
              <Link href="/dashboard/availability">
                <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Clock className="mr-2 h-4 w-4" />
                  Set Availability
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Recent Bookings</CardTitle>
                <CardDescription className="text-gray-600">Your latest appointments</CardDescription>
              </div>
              <Link href="/dashboard/bookings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-sm text-gray-500">Your upcoming appointments will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{booking.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(booking.startTime).toLocaleDateString()} at{' '}
                          {new Date(booking.startTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {booking.attendeeName} • {booking.attendeeEmail}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Public Profile Link */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Your Public Profile</CardTitle>
            <CardDescription className="text-gray-600">Share this link with others to let them book with you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <code className="flex-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                {typeof window !== 'undefined' ? `${window.location.origin}/${session?.user?.username}` : ''}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/${session?.user?.username}`)
                    toast.success('Link copied to clipboard')
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
