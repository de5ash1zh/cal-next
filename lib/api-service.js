// API Service for dynamic backend integration
class ApiService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Event Types API
  async getEventTypes() {
    return this.request('/api/event-types')
  }

  async createEventType(data) {
    return this.request('/api/event-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEventType(id, data) {
    return this.request(`/api/event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEventType(id) {
    return this.request(`/api/event-types/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleEventTypeStatus(id, isActive) {
    return this.request(`/api/event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
  }

  // Bookings API
  async getBookings(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/api/bookings?${params}`)
  }

  async getBooking(id) {
    return this.request(`/api/bookings/${id}`)
  }

  async createBooking(data) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBooking(id, data) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBooking(id) {
    return this.request(`/api/bookings/${id}`, {
      method: 'DELETE',
    })
  }

  async updateBookingStatus(id, status) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Availability API
  async getAvailability() {
    return this.request('/api/availability')
  }

  async createAvailability(data) {
    return this.request('/api/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAvailability(id, data) {
    return this.request(`/api/availability/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAvailability(id) {
    return this.request(`/api/availability/${id}`, {
      method: 'DELETE',
    })
  }

  async getAvailableSlots(date, eventTypeId) {
    const params = new URLSearchParams({
      date: date.toISOString(),
      eventTypeId,
    })
    return this.request(`/api/availability/slots?${params}`)
  }

  // Blocked Times API
  async getBlockedTimes() {
    return this.request('/api/blocked-times')
  }

  async createBlockedTime(data) {
    return this.request('/api/blocked-times', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBlockedTime(id, data) {
    return this.request(`/api/blocked-times/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBlockedTime(id) {
    return this.request(`/api/blocked-times/${id}`, {
      method: 'DELETE',
    })
  }

  // Analytics API
  async getAnalytics(timeRange = '30') {
    return this.request(`/api/analytics?timeRange=${timeRange}`)
  }

  // User Profile API
  async updateProfile(data) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(data) {
    return this.request('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateNotifications(data) {
    return this.request('/api/user/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Public Booking API
  async getPublicEventData(username, slug) {
    return this.request(`/api/public/${username}/${slug}`)
  }

  async createPublicBooking(username, slug, data) {
    return this.request(`/api/public/${username}/${slug}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Custom Fields API
  async getCustomFields(eventTypeId) {
    return this.request(`/api/event-types/${eventTypeId}/custom-fields`)
  }

  async createCustomField(eventTypeId, data) {
    return this.request(`/api/event-types/${eventTypeId}/custom-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomField(fieldId, data) {
    return this.request(`/api/custom-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomField(fieldId) {
    return this.request(`/api/custom-fields/${fieldId}`, {
      method: 'DELETE',
    })
  }

  // Utility methods
  async checkAvailability(startTime, endTime, userId) {
    return this.request('/api/availability/check', {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime, userId }),
    })
  }

  async generateMeetingLinks(eventTypeId, startTime, endTime) {
    return this.request('/api/meetings/generate-links', {
      method: 'POST',
      body: JSON.stringify({ eventTypeId, startTime, endTime }),
    })
  }

  // Error handling
  handleError(error) {
    if (error.message.includes('401')) {
      return 'Please sign in to continue'
    }
    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action'
    }
    if (error.message.includes('404')) {
      return 'The requested resource was not found'
    }
    if (error.message.includes('409')) {
      return 'This time slot is already booked'
    }
    if (error.message.includes('422')) {
      return 'Please check your input and try again'
    }
    if (error.message.includes('500')) {
      return 'Server error. Please try again later'
    }
    return error.message || 'An unexpected error occurred'
  }

  // Retry mechanism for failed requests
  async retryRequest(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  // Batch operations
  async batchCreate(items, endpoint, batchSize = 10) {
    const results = []
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(item => this.request(endpoint, {
          method: 'POST',
          body: JSON.stringify(item),
        }))
      )
      results.push(...batchResults)
    }
    return results
  }

  // Real-time updates (WebSocket fallback)
  async subscribeToUpdates(endpoint, callback) {
    // Implementation for real-time updates
    // This could use Server-Sent Events or WebSocket
    const eventSource = new EventSource(`${this.baseUrl}${endpoint}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        callback(data)
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      eventSource.close()
    }

    return () => eventSource.close()
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService
