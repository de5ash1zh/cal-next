'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Copy, 
  Plus,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard-layout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    try {
      const response = await fetch('/api/event-types')
      if (response.ok) {
        const data = await response.json()
        setEventTypes(data)
      }
    } catch (error) {
      console.error('Error fetching event types:', error)
      toast.error('Failed to fetch event types')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEventTypeStatus = async (eventTypeId, currentStatus) => {
    try {
      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      })

      if (response.ok) {
        setEventTypes(prev => 
          prev.map(et => 
            et.id === eventTypeId 
              ? { ...et, isActive: !currentStatus }
              : et
          )
        )
        toast.success(`Event type ${currentStatus ? 'deactivated' : 'activated'}`)
      }
    } catch (error) {
      console.error('Error updating event type:', error)
      toast.error('Failed to update event type')
    }
  }

  const duplicateEventType = async (eventType) => {
    try {
      const duplicateData = {
        title: `${eventType.title} (Copy)`,
        slug: `${eventType.slug}-copy-${Date.now()}`,
        description: eventType.description,
        duration: eventType.duration,
        price: eventType.price,
        color: eventType.color,
        isActive: false
      }

      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      })

      if (response.ok) {
        const newEventType = await response.json()
        setEventTypes(prev => [newEventType, ...prev])
        toast.success('Event type duplicated successfully')
      }
    } catch (error) {
      console.error('Error duplicating event type:', error)
      toast.error('Failed to duplicate event type')
    }
  }

  const deleteEventType = async (eventTypeId) => {
    if (!confirm('Are you sure you want to delete this event type? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEventTypes(prev => prev.filter(et => et.id !== eventTypeId))
        toast.success('Event type deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete event type')
      }
    } catch (error) {
      console.error('Error deleting event type:', error)
      toast.error('Failed to delete event type')
    }
  }

  const copyBookingLink = (username, slug) => {
    const link = `${window.location.origin}/${username}/${slug}`
    navigator.clipboard.writeText(link)
    toast.success('Booking link copied to clipboard')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
            <p className="text-gray-600">Manage your event types and availability</p>
          </div>
          <Link href="/dashboard/event-types/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event Type
            </Button>
          </Link>
        </div>

        {/* Event Types Grid */}
        {eventTypes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No event types</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first event type.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/event-types/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Event Type
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{eventType.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {eventType.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyBookingLink('username', eventType.slug)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateEventType(eventType)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <Link href={`/dashboard/event-types/${eventType.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={() => deleteEventType(eventType.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {eventType.duration} minutes
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={eventType.isActive}
                        onCheckedChange={() => toggleEventTypeStatus(eventType.id, eventType.isActive)}
                      />
                      <Badge variant={eventType.isActive ? "default" : "secondary"}>
                        {eventType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {eventType.price && eventType.price > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="font-medium">${eventType.price}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <Link href={`/${'username'}/${eventType.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
