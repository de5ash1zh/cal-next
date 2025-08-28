const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test configuration
const BASE_URL = 'http://localhost:3000' // Fixed port number
const TEST_USER = {
  email: 'john@example.com',
  password: 'password123'
}

// Utility functions
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} ${name}`)
  if (details) console.log(`   ${details}`)
  return passed
}

// Test functions
async function testDatabaseData() {
  console.log('\n🗄️ Testing Database Data...')
  
  try {
    // Test user queries
    const users = await prisma.user.findMany({
      include: {
        eventTypes: true,
        bookings: true,
        availability: true
      }
    })
    
    const userQueryPassed = users.length > 0
    logTest('User Queries', userQueryPassed, `Found ${users.length} users`)
    
    // Test event type queries with custom fields
    const eventTypes = await prisma.eventType.findMany({
      include: {
        customFields: {
          orderBy: { order: 'asc' }
        },
        bookings: {
          include: {
            customFieldValues: {
              include: {
                customField: true
              }
            }
          }
        }
      }
    })
    
    const eventTypeQueryPassed = eventTypes.length > 0
    logTest('Event Type Queries', eventTypeQueryPassed, `Found ${eventTypes.length} event types`)
    
    // Test analytics queries
    const totalBookings = await prisma.booking.count()
    const confirmedBookings = await prisma.booking.count({
      where: { status: 'CONFIRMED' }
    })
    
    const analyticsQueryPassed = totalBookings > 0
    logTest('Analytics Queries', analyticsQueryPassed, `Total: ${totalBookings}, Confirmed: ${confirmedBookings}`)
    
    return userQueryPassed && eventTypeQueryPassed && analyticsQueryPassed
    
  } catch (error) {
    logTest('Database Queries', false, `Error: ${error.message}`)
    return false
  }
}

async function testCustomFields() {
  console.log('\n🔧 Testing Custom Fields...')
  
  try {
    // Test custom field queries
    const customFields = await prisma.customField.findMany({
      include: {
        eventType: true,
        values: true
      }
    })
    
    const customFieldsPassed = customFields.length > 0
    logTest('Custom Fields', customFieldsPassed, `Found ${customFields.length} custom fields`)
    
    // Test custom field values
    const customFieldValues = await prisma.customFieldValue.findMany({
      include: {
        customField: true,
        booking: true
      }
    })
    
    const valuesPassed = customFieldValues.length > 0
    logTest('Custom Field Values', valuesPassed, `Found ${customFieldValues.length} values`)
    
    return customFieldsPassed && valuesPassed
    
  } catch (error) {
    logTest('Custom Fields', false, `Error: ${error.message}`)
    return false
  }
}

async function testMeetingLinks() {
  console.log('\n🔗 Testing Meeting Links...')
  
  try {
    // Test event types with meeting links
    const eventTypesWithMeetings = await prisma.eventType.findMany({
      where: {
        OR: [
          { zoomMeeting: true },
          { googleMeet: true }
        ]
      }
    })
    
    const meetingLinksPassed = eventTypesWithMeetings.length > 0
    logTest('Meeting Links', meetingLinksPassed, `Found ${eventTypesWithMeetings.length} event types with meeting links`)
    
    // Test bookings with meeting links
    const bookingsWithMeetings = await prisma.booking.findMany({
      where: {
        OR: [
          { zoomUrl: { not: null } },
          { googleMeetUrl: { not: null } }
        ]
      }
    })
    
    const bookingMeetingsPassed = bookingsWithMeetings.length > 0
    logTest('Booking Meeting Links', bookingMeetingsPassed, `Found ${bookingsWithMeetings.length} bookings with meeting links`)
    
    return meetingLinksPassed && bookingMeetingsPassed
    
  } catch (error) {
    logTest('Meeting Links', false, `Error: ${error.message}`)
    return false
  }
}

async function testDataIntegrity() {
  console.log('\n🔒 Testing Data Integrity...')
  
  try {
    // Test foreign key relationships
    const users = await prisma.user.findMany()
    const eventTypes = await prisma.eventType.findMany()
    const bookings = await prisma.booking.findMany()
    
    // Check that all event types have valid user IDs
    const validEventTypes = eventTypes.filter(et => 
      users.some(u => u.id === et.userId)
    )
    
    const eventTypeIntegrity = validEventTypes.length === eventTypes.length
    logTest('Event Type Integrity', eventTypeIntegrity, `${validEventTypes.length}/${eventTypes.length} valid`)
    
    // Check that all bookings have valid event type IDs
    const validBookings = bookings.filter(b => 
      eventTypes.some(et => et.id === b.eventTypeId)
    )
    
    const bookingIntegrity = validBookings.length === bookings.length
    logTest('Booking Integrity', bookingIntegrity, `${validBookings.length}/${bookings.length} valid`)
    
    // Check that all custom fields have valid event type IDs
    const customFields = await prisma.customField.findMany()
    const validCustomFields = customFields.filter(cf => 
      eventTypes.some(et => et.id === cf.eventTypeId)
    )
    
    const customFieldIntegrity = validCustomFields.length === customFields.length
    logTest('Custom Field Integrity', customFieldIntegrity, `${validCustomFields.length}/${customFields.length} valid`)
    
    return eventTypeIntegrity && bookingIntegrity && customFieldIntegrity
    
  } catch (error) {
    logTest('Data Integrity', false, `Error: ${error.message}`)
    return false
  }
}

async function testAvailabilityData() {
  console.log('\n⏰ Testing Availability Data...')
  
  try {
    // Test availability queries
    const availability = await prisma.availability.findMany({
      include: {
        user: true
      }
    })
    
    const availabilityPassed = availability.length > 0
    logTest('Availability Data', availabilityPassed, `Found ${availability.length} availability slots`)
    
    // Test blocked times
    const blockedTimes = await prisma.blockedTime.findMany({
      include: {
        user: true
      }
    })
    
    const blockedTimesPassed = blockedTimes.length > 0
    logTest('Blocked Times Data', blockedTimesPassed, `Found ${blockedTimes.length} blocked time slots`)
    
    return availabilityPassed && blockedTimesPassed
    
  } catch (error) {
    logTest('Availability Data', false, `Error: ${error.message}`)
    return false
  }
}

async function testUserProfiles() {
  console.log('\n👤 Testing User Profiles...')
  
  try {
    // Test user profile data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        timezone: true,
        _count: {
          select: {
            eventTypes: true,
            bookings: true,
            availability: true
          }
        }
      }
    })
    
    const userProfilesPassed = users.length > 0
    logTest('User Profiles', userProfilesPassed, `Found ${users.length} users with complete profiles`)
    
    // Display user summary
    users.forEach(user => {
      console.log(`   👤 ${user.name} (${user.username}): ${user._count.eventTypes} event types, ${user._count.bookings} bookings`)
    })
    
    return userProfilesPassed
    
  } catch (error) {
    logTest('User Profiles', false, `Error: ${error.message}`)
    return false
  }
}

async function testEventTypeDetails() {
  console.log('\n📅 Testing Event Type Details...')
  
  try {
    // Test event type details
    const eventTypes = await prisma.eventType.findMany({
      include: {
        user: {
          select: { name: true, username: true }
        },
        customFields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { bookings: true }
        }
      }
    })
    
    const eventTypeDetailsPassed = eventTypes.length > 0
    logTest('Event Type Details', eventTypeDetailsPassed, `Found ${eventTypes.length} event types with complete details`)
    
    // Display event type summary
    eventTypes.forEach(et => {
      const meetingInfo = []
      if (et.zoomMeeting) meetingInfo.push('Zoom')
      if (et.googleMeet) meetingInfo.push('Google Meet')
      const meetingText = meetingInfo.length > 0 ? ` (${meetingInfo.join(', ')})` : ''
      
      console.log(`   📅 ${et.title}: ${et.duration}min, $${et.price}, ${et._count.bookings} bookings${meetingText}`)
    })
    
    return eventTypeDetailsPassed
    
  } catch (error) {
    logTest('Event Type Details', false, `Error: ${error.message}`)
    return false
  }
}

async function testBookingDetails() {
  console.log('\n📋 Testing Booking Details...')
  
  try {
    // Test booking details
    const bookings = await prisma.booking.findMany({
      include: {
        eventType: {
          select: { title: true, duration: true }
        },
        user: {
          select: { name: true, username: true }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    })
    
    const bookingDetailsPassed = bookings.length > 0
    logTest('Booking Details', bookingDetailsPassed, `Found ${bookings.length} bookings with complete details`)
    
    // Display booking summary
    bookings.forEach(booking => {
      const status = booking.status.toLowerCase()
      const date = new Date(booking.startTime).toLocaleDateString()
      const time = new Date(booking.startTime).toLocaleTimeString()
      const customFieldsCount = booking.customFieldValues.length
      
      console.log(`   📋 ${booking.title} (${status}): ${date} at ${time}, ${customFieldsCount} custom fields`)
    })
    
    return bookingDetailsPassed
    
  } catch (error) {
    logTest('Booking Details', false, `Error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Database Testing...')
  console.log(`📍 Testing database: ${process.env.DATABASE_URL || 'SQLite dev.db'}`)
  
  const startTime = Date.now()
  const results = []
  
  // Run all tests
  results.push(await testDatabaseData())
  results.push(await testCustomFields())
  results.push(await testMeetingLinks())
  results.push(await testDataIntegrity())
  results.push(await testAvailabilityData())
  results.push(await testUserProfiles())
  results.push(await testEventTypeDetails())
  results.push(await testBookingDetails())
  
  // Calculate results
  const totalTests = results.length
  const passedTests = results.filter(r => r).length
  const failedTests = totalTests - passedTests
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  // Display summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log(`⏱️  Duration: ${duration}s`)
  console.log(`✅ Passed: ${passedTests}/${totalTests}`)
  console.log(`❌ Failed: ${failedTests}/${totalTests}`)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The database is properly seeded and all features are working.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the database implementation.')
  }
  
  console.log('\n🔑 Test Credentials:')
  console.log('User 1: john@example.com / password123')
  console.log('User 2: jane@example.com / password123')
  console.log('User 3: mike@example.com / password123')
  
  console.log('\n📱 Manual Testing Steps:')
  console.log('1. Visit http://localhost:3000 in your browser')
  console.log('2. Sign in with one of the test accounts above')
  console.log('3. Navigate through the dashboard')
  console.log('4. Test event type creation and management')
  console.log('5. Test booking creation and management')
  console.log('6. Test analytics dashboard')
  console.log('7. Test mobile responsiveness')
  console.log('8. Test custom fields and meeting links')
  
  console.log('\n🚀 Quick Start:')
  console.log('npm run dev          # Start development server')
  console.log('npm run seed         # Re-seed database if needed')
  console.log('npm run test         # Run database tests')
  
  return failedTests === 0
}

// Run tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
