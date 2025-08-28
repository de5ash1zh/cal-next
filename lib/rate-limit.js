// Simple in-memory rate limiting (for development)
// In production, use Redis or a similar service

const rateLimitStore = new Map()

export function createRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip || 'anonymous'
  } = options

  return function rateLimit(req) {
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now - windowMs

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, [])
    }

    const requests = rateLimitStore.get(key)
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (validRequests.length >= max) {
      return {
        success: false,
        message,
        statusCode,
        remaining: 0,
        resetTime: new Date(now + windowMs)
      }
    }

    // Add current request
    validRequests.push(now)
    rateLimitStore.set(key, validRequests)

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [storeKey, timestamps] of rateLimitStore.entries()) {
        const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart)
        if (validTimestamps.length === 0) {
          rateLimitStore.delete(storeKey)
        } else {
          rateLimitStore.set(storeKey, validTimestamps)
        }
      }
    }

    return {
      success: true,
      remaining: max - validRequests.length,
      resetTime: new Date(now + windowMs)
    }
  }
}

export function applyRateLimit(rateLimiter, req) {
  const result = rateLimiter(req)
  
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      statusCode: result.statusCode
    }
  }

  return {
    success: true,
    headers: {
      'X-RateLimit-Limit': 100,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime.toISOString()
    }
  }
}
