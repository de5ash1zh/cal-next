'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, User, Mail, Phone, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function MobileBookingFlow({ eventType, onBookingComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [formData, setFormData] = useState({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    notes: ''
  })
  const [customFieldValues, setCustomFieldValues] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState([])
  
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const steps = [
    { id: 'date', title: 'Select Date', icon: Calendar },
    { id: 'time', title: 'Select Time', icon: Clock },
    { id: 'details', title: 'Your Details', icon: User },
    { id: 'confirm', title: 'Confirm Booking', icon: Check }
  ]

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await fetch(`/api/availability/slots?date=${date.toISOString()}&eventTypeId=${eventType.id}`)
      if (response.ok) {
        const slots = await response.json()
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentStep < steps.length - 1) {
        // Swipe left - next step
        nextStep()
      } else if (diff < 0 && currentStep > 0) {
        // Swipe right - previous step
        prevStep()
      }
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time')
      return
    }

    if (!formData.attendeeName || !formData.attendeeEmail) {
      toast.error('Please fill in required fields')
      return
    }

    setIsLoading(true)

    try {
      const startTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + eventType.duration)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventType.title,
          description: eventType.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendeeName: formData.attendeeName,
          attendeeEmail: formData.attendeeEmail,
          attendeePhone: formData.attendeePhone,
          notes: formData.notes,
          eventTypeId: eventType.id,
          customFieldValues: Object.entries(customFieldValues).map(([fieldId, value]) => ({
            customFieldId: fieldId,
            value: value
          }))
        }),
      })

      if (response.ok) {
        toast.success('Booking confirmed!')
        onBookingComplete && onBookingComplete()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('An error occurred while creating the booking')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(date)}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-medium">{date.getDate()}</div>
                    <div className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(slot.time)}
                  className={`p-4 text-center rounded-lg border transition-colors ${
                    selectedTime === slot.time
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            {availableSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No available time slots for this date
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="attendeeName" className="text-sm font-medium text-gray-700">
                Name *
              </Label>
              <Input
                id="attendeeName"
                name="attendeeName"
                value={formData.attendeeName}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="attendeeEmail" className="text-sm font-medium text-gray-700">
                Email *
              </Label>
              <Input
                id="attendeeEmail"
                name="attendeeEmail"
                type="email"
                value={formData.attendeeEmail}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="attendeePhone" className="text-sm font-medium text-gray-700">
                Phone (optional)
              </Label>
              <Input
                id="attendeePhone"
                name="attendeePhone"
                type="tel"
                value={formData.attendeePhone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information..."
                rows={3}
                className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            {/* Custom Fields */}
            {eventType.customFields && eventType.customFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Additional Information</h3>
                {eventType.customFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {field.name} {field.required && '*'}
                    </Label>
                    
                    {field.type === 'TEXT' && (
                      <Input
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required={field.required}
                      />
                    )}

                    {field.type === 'TEXTAREA' && (
                      <Textarea
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        rows={3}
                        className="border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                        required={field.required}
                      />
                    )}

                    {field.type === 'SELECT' && (
                      <Select
                        value={customFieldValues[field.id] || ''}
                        onValueChange={(value) => handleCustomFieldChange(field.id, value)}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                          <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.split('\n').map((option) => (
                            <SelectItem key={option} value={option.trim()}>
                              {option.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'CHECKBOX' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`field-${field.id}`}
                          checked={customFieldValues[field.id] || false}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <Label htmlFor={`field-${field.id}`} className="text-sm text-gray-600">
                          {field.name}
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Review Your Booking</h3>
              <p className="text-gray-600">Please confirm the details below</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{eventType.title}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{eventType.duration} minutes</span>
                  </div>
                  {eventType.price && eventType.price > 0 && (
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>${eventType.price}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Your Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span>{formData.attendeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>{formData.attendeeEmail}</span>
                  </div>
                  {formData.attendeePhone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{formData.attendeePhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-center flex-1 px-2">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{steps[currentStep].title}</h1>
            <p className="text-xs sm:text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex space-x-3 mt-4 sm:mt-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base"
            >
              {isLoading ? 'Confirming...' : (
                <>
                  <span className="hidden sm:inline">Confirm Booking</span>
                  <span className="sm:hidden">Confirm</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Swipe Hint */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            💡 Swipe left/right to navigate between steps
          </p>
        </div>
      </div>
    </div>
  )
}
