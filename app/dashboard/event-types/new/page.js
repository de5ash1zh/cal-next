'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Calendar, Plus, Trash2, Video, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard-layout'
import Link from 'next/link'

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 480, label: '8 hours' },
]

const colorOptions = [
  { value: '#6b7280', label: 'Gray' },
  { value: '#374151', label: 'Dark Gray' },
  { value: '#111827', label: 'Black' },
  { value: '#9ca3af', label: 'Light Gray' },
  { value: '#d1d5db', label: 'Lighter Gray' },
  { value: '#f3f4f6', label: 'Lightest Gray' },
]

const customFieldTypes = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'RADIO', label: 'Radio Buttons' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'DATE', label: 'Date' },
  { value: 'TIME', label: 'Time' },
]

export default function NewEventTypePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    duration: 30,
    price: '',
    color: '#6b7280',
    isActive: true,
    zoomMeeting: false,
    googleMeet: false,
    zoomUrl: '',
    googleMeetUrl: ''
  })
  const [customFields, setCustomFields] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const addCustomField = () => {
    const newField = {
      id: Date.now(),
      name: '',
      type: 'TEXT',
      required: false,
      options: '',
      order: customFields.length
    }
    setCustomFields([...customFields, newField])
  }

  const updateCustomField = (id, field, value) => {
    setCustomFields(prev => 
      prev.map(f => f.id === id ? { ...f, [field]: value } : f)
    )
  }

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : 0,
          customFields: customFields.filter(f => f.name.trim() !== '')
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Event type created successfully!')
        router.push('/dashboard/event-types')
      } else {
        toast.error(data.error || 'Failed to create event type')
      }
    } catch (error) {
      console.error('Error creating event type:', error)
      toast.error('An error occurred while creating the event type')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/event-types">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Event Type</h1>
            <p className="text-gray-600 mt-2">Create a new event type for your calendar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Basic Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Set the basic details for your event type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Event Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., 30 Minute Meeting"
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                      URL Slug *
                    </Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="e.g., 30-minute-meeting"
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      This will be used in your booking URL
                    </p>
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
                      placeholder="Brief description of this event type"
                      rows={3}
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Duration & Pricing</CardTitle>
                  <CardDescription className="text-gray-600">
                    Set how long the event takes and optional pricing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                      Duration *
                    </Label>
                    <Select
                      value={formData.duration.toString()}
                      onValueChange={(value) => handleSelectChange('duration', parseInt(value))}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Price (optional)
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty for free events
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Meeting Links</CardTitle>
                  <CardDescription className="text-gray-600">
                    Automatically add video meeting links to bookings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-gray-500" />
                        <Label className="text-sm font-medium text-gray-700">Zoom Meeting</Label>
                      </div>
                      <Switch
                        checked={formData.zoomMeeting}
                        onCheckedChange={(checked) => handleSwitchChange('zoomMeeting', checked)}
                      />
                    </div>
                    
                    {formData.zoomMeeting && (
                      <div className="space-y-2">
                        <Label htmlFor="zoomUrl" className="text-sm font-medium text-gray-700">
                          Zoom URL Template
                        </Label>
                        <Input
                          id="zoomUrl"
                          name="zoomUrl"
                          value={formData.zoomUrl}
                          onChange={handleChange}
                          placeholder="https://zoom.us/j/123456789"
                          className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        />
                        <p className="text-xs text-gray-500">
                          Use {`{meetingId}`} for dynamic meeting IDs
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <Label className="text-sm font-medium text-gray-700">Google Meet</Label>
                      </div>
                      <Switch
                        checked={formData.googleMeet}
                        onCheckedChange={(checked) => handleSwitchChange('googleMeet', checked)}
                      />
                    </div>
                    
                    {formData.googleMeet && (
                      <div className="space-y-2">
                        <Label htmlFor="googleMeetUrl" className="text-sm font-medium text-gray-700">
                          Google Meet URL Template
                        </Label>
                        <Input
                          id="googleMeetUrl"
                          name="googleMeetUrl"
                          value={formData.googleMeetUrl}
                          onChange={handleChange}
                          placeholder="https://meet.google.com/abc-defg-hij"
                          className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        />
                        <p className="text-xs text-gray-500">
                          Use {`{meetingId}`} for dynamic meeting IDs
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Appearance</CardTitle>
                  <CardDescription className="text-gray-600">
                    Customize how this event type appears
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Color</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${
                            formData.color === color.value
                              ? 'border-gray-900 scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleSelectChange('color', color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                      />
                      <Label className="text-sm text-gray-600">
                        Active (accepting bookings)
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Custom Fields</CardTitle>
                  <CardDescription className="text-gray-600">
                    Collect additional information from attendees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Field {field.order + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomField(field.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Field Name</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                            placeholder="e.g., Company"
                            className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateCustomField(field.id, 'type', value)}
                          >
                            <SelectTrigger className="border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {customFieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(field.type === 'SELECT' || field.type === 'RADIO') && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Options (one per line)</Label>
                          <Textarea
                            value={field.options}
                            onChange={(e) => updateCustomField(field.id, 'options', e.target.value)}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                            className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateCustomField(field.id, 'required', checked)}
                        />
                        <Label className="text-sm text-gray-600">Required field</Label>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomField}
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Preview</CardTitle>
                  <CardDescription className="text-gray-600">
                    How your event type will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: formData.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {formData.title || 'Event Title'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formData.duration} minutes
                          {formData.price && formData.price > 0 && ` • $${formData.price}`}
                        </p>
                        {formData.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formData.description}
                          </p>
                        )}
                        {(formData.zoomMeeting || formData.googleMeet) && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Video className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Video meeting included
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

                  {/* Submit Button */}
        <div className="flex justify-end pt-8 border-t border-gray-200">
          <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2.5 shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Event Type'}
          </Button>
        </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
