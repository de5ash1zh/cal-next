'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard-layout'

const daysOfWeek = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
]

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState([])
  const [blockedTimes, setBlockedTimes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddBlocked, setShowAddBlocked] = useState(false)
  const [newBlockedTime, setNewBlockedTime] = useState({
    startTime: '',
    endTime: '',
    reason: ''
  })

  useEffect(() => {
    fetchAvailability()
    fetchBlockedTimes()
  }, [])

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability')
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to fetch availability')
    }
  }

  const fetchBlockedTimes = async () => {
    try {
      const response = await fetch('/api/blocked-times')
      if (response.ok) {
        const data = await response.json()
        setBlockedTimes(data)
      }
    } catch (error) {
      console.error('Error fetching blocked times:', error)
      // Blocked times endpoint might not exist yet, that's okay
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvailabilityChange = async (dayOfWeek, field, value) => {
    try {
      const existingSlot = availability.find(slot => slot.dayOfWeek === dayOfWeek)
      
      if (existingSlot) {
        // Update existing slot
        const response = await fetch(`/api/availability/${existingSlot.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...existingSlot,
            [field]: value
          }),
        })

        if (response.ok) {
          setAvailability(prev => 
            prev.map(slot => 
              slot.dayOfWeek === dayOfWeek 
                ? { ...slot, [field]: value }
                : slot
            )
          )
          toast.success('Availability updated')
        }
      } else {
        // Create new slot
        const response = await fetch('/api/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00'
          }),
        })

        if (response.ok) {
          const newSlot = await response.json()
          setAvailability(prev => [...prev, newSlot])
          toast.success('Availability slot created')
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  const handleAddBlockedTime = async () => {
    if (!newBlockedTime.startTime || !newBlockedTime.endTime || !newBlockedTime.reason) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/blocked-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlockedTime),
      })

      if (response.ok) {
        const newBlocked = await response.json()
        setBlockedTimes(prev => [...prev, newBlocked])
        setNewBlockedTime({ startTime: '', endTime: '', reason: '' })
        setShowAddBlocked(false)
        toast.success('Blocked time added')
      }
    } catch (error) {
      console.error('Error adding blocked time:', error)
      toast.error('Failed to add blocked time')
    }
  }

  const handleDeleteBlockedTime = async (id) => {
    try {
      const response = await fetch(`/api/blocked-times/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBlockedTimes(prev => prev.filter(blocked => blocked.id !== id))
        toast.success('Blocked time removed')
      }
    } catch (error) {
      console.error('Error deleting blocked time:', error)
      toast.error('Failed to remove blocked time')
    }
  }

  const getAvailabilityForDay = (dayOfWeek) => {
    return availability.find(slot => slot.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      enabled: false
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
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-600 mt-2">Set your weekly schedule and blocked times</p>
        </div>

        {/* Weekly Schedule */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Weekly Schedule</CardTitle>
            <CardDescription className="text-gray-600">
              Set your available hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const dayAvailability = getAvailabilityForDay(day.value)
                return (
                  <div key={day.value} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    <div className="w-24">
                      <Label className="text-sm font-medium text-gray-700">{day.label}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!!dayAvailability.startTime}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleAvailabilityChange(day.value, 'startTime', '09:00')
                            handleAvailabilityChange(day.value, 'endTime', '17:00')
                          } else {
                            handleAvailabilityChange(day.value, 'startTime', '')
                            handleAvailabilityChange(day.value, 'endTime', '')
                          }
                        }}
                      />
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                    
                    {dayAvailability.startTime && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={dayAvailability.startTime}
                          onChange={(e) => handleAvailabilityChange(day.value, 'startTime', e.target.value)}
                          className="w-32 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={dayAvailability.endTime}
                          onChange={(e) => handleAvailabilityChange(day.value, 'endTime', e.target.value)}
                          className="w-32 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Blocked Times */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Blocked Times</CardTitle>
                <CardDescription className="text-gray-600">
                  Mark specific times as unavailable
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddBlocked(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Blocked Time
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddBlocked && (
              <div className="p-4 border border-gray-200 rounded-lg mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={newBlockedTime.startTime}
                      onChange={(e) => setNewBlockedTime(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">End Time</Label>
                    <Input
                      type="datetime-local"
                      value={newBlockedTime.endTime}
                      onChange={(e) => setNewBlockedTime(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Reason</Label>
                    <Input
                      type="text"
                      value={newBlockedTime.reason}
                      onChange={(e) => setNewBlockedTime(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Lunch break"
                      className="mt-1 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Button onClick={handleAddBlockedTime} className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddBlocked(false)
                      setNewBlockedTime({ startTime: '', endTime: '', reason: '' })
                    }}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {blockedTimes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No blocked times set</p>
              ) : (
                blockedTimes.map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(blocked.startTime).toLocaleDateString()} {new Date(blocked.startTime).toLocaleTimeString()} - {new Date(blocked.endTime).toLocaleTimeString()}
                        </p>
                        {blocked.reason && (
                          <p className="text-sm text-gray-600">{blocked.reason}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlockedTime(blocked.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
