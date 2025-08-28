'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Calendar, Clock, User, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard-layout'

export default function NewBookingPage() {
  const router = useRouter()
  const [eventTypes, setEventTypes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    notes: '',
    eventTypeId: '',
    status: 'CONFIRMED'
  })

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
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-fill duration if event type is selected
    if (name === 'eventTypeId' && value) {
      const selectedEventType = eventTypes.find(et => et.id === value)
      if (selectedEventType) {
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + selectedEventType.duration * 60 * 1000)
        
        setFormData(prev => ({
          ...prev,
          title: selectedEventType.title,
          description: selectedEventType.description,
          startTime: startTime.toISOString().slice(0, 16),
          endTime: endTime.toISOString().slice(0, 16)
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Booking created successfully!')
        router.push('/dashboard/bookings')
      } else {
        toast.error(data.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('An error occurred while creating the booking')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
            <p className="text-gray-600 mt-2">Create a new booking manually</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Event Details</CardTitle>
                  <CardDescription className="text-gray-600">
                    Basic information about the booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTypeId" className="text-sm font-medium text-gray-700">
                      Event Type *
                    </Label>
                    <Select value={formData.eventTypeId} onValueChange={(value) => handleSelectChange('eventTypeId', value)}>
                      <SelectTrigger className="border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                        <SelectValue placeholder="Select an event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((eventType) => (
                          <SelectItem key={eventType.id} value={eventType.id}>
                            {eventType.title} ({eventType.duration} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Client Meeting"
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the meeting"
                      rows={3}
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status *
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger className="border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Schedule</CardTitle>
                  <CardDescription className="text-gray-600">
                    When the meeting will take place
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                      Start Time *
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="startTime"
                        name="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="pl-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                      End Time *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="endTime"
                        name="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="pl-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Attendee Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Details about the person attending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendeeName" className="text-sm font-medium text-gray-700">
                      Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="attendeeName"
                        name="attendeeName"
                        value={formData.attendeeName}
                        onChange={handleChange}
                        placeholder="Full name"
                        className="pl-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendeeEmail" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="attendeeEmail"
                        name="attendeeEmail"
                        type="email"
                        value={formData.attendeeEmail}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className="pl-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendeePhone" className="text-sm font-medium text-gray-700">
                      Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="attendeePhone"
                        name="attendeePhone"
                        type="tel"
                        value={formData.attendeePhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes or context"
                      rows={3}
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-8 border-t border-gray-200">
            <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2.5">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
