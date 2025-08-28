const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blockedTime.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log("👥 Creating test users...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      username: "johndoe",
      password: hashedPassword,
      bio: "Professional consultant and business coach",
      timezone: "America/New_York",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      username: "janesmith",
      password: hashedPassword,
      bio: "UX Designer and creative consultant",
      timezone: "Europe/London",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Mike Johnson",
      email: "mike@example.com",
      username: "mikejohnson",
      password: hashedPassword,
      bio: "Software engineer and tech mentor",
      timezone: "America/Los_Angeles",
    },
  });

  console.log("✅ Users created:", [
    user1.username,
    user2.username,
    user3.username,
  ]);

  // Create event types for user1
  console.log("📅 Creating event types...");

  const eventType1 = await prisma.eventType.create({
    data: {
      title: "30 Minute Consultation",
      slug: "30-minute-consultation",
      description:
        "Quick consultation call to discuss your needs and how I can help",
      duration: 30,
      price: 50,
      isActive: true,
      color: "#6b7280",
      zoomMeeting: true,
      googleMeet: false,
      zoomUrl: "https://zoom.us/j/{meetingId}",
      userId: user1.id,
    },
  });

  const eventType2 = await prisma.eventType.create({
    data: {
      title: "1 Hour Strategy Session",
      slug: "1-hour-strategy-session",
      description:
        "Comprehensive strategy session with detailed planning and recommendations",
      duration: 60,
      price: 150,
      isActive: true,
      color: "#374151",
      zoomMeeting: true,
      googleMeet: true,
      zoomUrl: "https://zoom.us/j/{meetingId}",
      googleMeetUrl: "https://meet.google.com/{meetingId}",
      userId: user1.id,
    },
  });

  const eventType3 = await prisma.eventType.create({
    data: {
      title: "2 Hour Workshop",
      slug: "2-hour-workshop",
      description:
        "Interactive workshop with hands-on exercises and group activities",
      duration: 120,
      price: 300,
      isActive: false,
      color: "#111827",
      zoomMeeting: false,
      googleMeet: false,
      userId: user1.id,
    },
  });

  // Create event types for user2
  const eventType4 = await prisma.eventType.create({
    data: {
      title: "Design Review",
      slug: "design-review",
      description: "Professional design review and feedback session",
      duration: 45,
      price: 75,
      isActive: true,
      color: "#9ca3af",
      zoomMeeting: true,
      googleMeet: false,
      zoomUrl: "https://zoom.us/j/{meetingId}",
      userId: user2.id,
    },
  });

  const eventType5 = await prisma.eventType.create({
    data: {
      title: "Portfolio Review",
      slug: "portfolio-review",
      description: "Comprehensive portfolio review with career advice",
      duration: 90,
      price: 120,
      isActive: true,
      color: "#d1d5db",
      zoomMeeting: false,
      googleMeet: true,
      googleMeetUrl: "https://meet.google.com/{meetingId}",
      userId: user2.id,
    },
  });

  console.log("✅ Event types created for users");

  // Create custom fields for event types
  console.log("🔧 Creating custom fields...");

  const customField1 = await prisma.customField.create({
    data: {
      name: "Company",
      type: "TEXT",
      required: true,
      order: 0,
      eventTypeId: eventType1.id,
      userId: user1.id,
    },
  });

  const customField2 = await prisma.customField.create({
    data: {
      name: "Project Type",
      type: "SELECT",
      required: true,
      options: "Business Strategy\nMarketing\nOperations\nTechnology\nOther",
      order: 1,
      eventTypeId: eventType1.id,
      userId: user1.id,
    },
  });

  const customField3 = await prisma.customField.create({
    data: {
      name: "Budget Range",
      type: "RADIO",
      required: false,
      options: "Under $5K\n$5K - $25K\n$25K - $100K\nOver $100K",
      order: 2,
      eventTypeId: eventType1.id,
      userId: user1.id,
    },
  });

  const customField4 = await prisma.customField.create({
    data: {
      name: "Design Style Preference",
      type: "SELECT",
      required: false,
      options: "Minimalist\nModern\nClassic\nCreative\nCorporate",
      order: 0,
      eventTypeId: eventType4.id,
      userId: user2.id,
    },
  });

  const customField5 = await prisma.customField.create({
    data: {
      name: "Experience Level",
      type: "RADIO",
      required: true,
      options: "Beginner\nIntermediate\nAdvanced\nExpert",
      order: 1,
      eventTypeId: eventType4.id,
      userId: user2.id,
    },
  });

  console.log("✅ Custom fields created");

  // Create availability schedules
  console.log("⏰ Creating availability schedules...");

  // User1 availability (Monday-Friday, 9 AM - 5 PM)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        userId: user1.id,
      },
    });
  }

  // User2 availability (Monday-Friday, 10 AM - 6 PM)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
        userId: user2.id,
      },
    });
  }

  // User3 availability (Tuesday-Thursday, 2 PM - 8 PM)
  for (let day = 2; day <= 4; day++) {
    await prisma.availability.create({
      data: {
        dayOfWeek: day,
        startTime: "14:00",
        endTime: "20:00",
        userId: user3.id,
      },
    });
  }

  console.log("✅ Availability schedules created");

  // Create sample bookings
  console.log("📋 Creating sample bookings...");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  twoWeeksAgo.setHours(11, 0, 0, 0);

  // Create bookings for user1
  const booking1 = await prisma.booking.create({
    data: {
      title: "Business Strategy Consultation",
      description: "Initial consultation for startup business strategy",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      status: "CONFIRMED",
      attendeeName: "Alice Johnson",
      attendeeEmail: "alice@startup.com",
      attendeePhone: "+1-555-0123",
      notes: "First-time client, interested in growth strategy",
      eventTypeId: eventType1.id,
      userId: user1.id,
      zoomUrl: "https://zoom.us/j/abc123",
      customFieldValues: {
        create: [
          {
            value: "TechStart Inc.",
            customFieldId: customField1.id,
          },
          {
            value: "Business Strategy",
            customFieldId: customField2.id,
          },
          {
            value: "$5K - $25K",
            customFieldId: customField3.id,
          },
        ],
      },
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      title: "Marketing Strategy Session",
      description: "Comprehensive marketing strategy planning",
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 60 * 60 * 1000),
      status: "CONFIRMED",
      attendeeName: "Bob Wilson",
      attendeeEmail: "bob@marketing.com",
      attendeePhone: "+1-555-0456",
      notes: "Returning client, expanding marketing efforts",
      eventTypeId: eventType2.id,
      userId: user1.id,
      zoomUrl: "https://zoom.us/j/def456",
      customFieldValues: {
        create: [
          {
            value: "Marketing Pro LLC",
            customFieldId: customField1.id,
          },
          {
            value: "Marketing",
            customFieldId: customField2.id,
          },
          {
            value: "$25K - $100K",
            customFieldId: customField3.id,
          },
        ],
      },
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      title: "Operations Review",
      description: "Operations efficiency consultation",
      startTime: twoWeeksAgo,
      endTime: new Date(twoWeeksAgo.getTime() + 30 * 60 * 1000),
      status: "COMPLETED",
      attendeeName: "Carol Davis",
      attendeeEmail: "carol@operations.com",
      attendeePhone: "+1-555-0789",
      notes: "Completed successfully, client satisfied",
      eventTypeId: eventType1.id,
      userId: user1.id,
      customFieldValues: {
        create: [
          {
            value: "OpsCorp",
            customFieldId: customField1.id,
          },
          {
            value: "Operations",
            customFieldId: customField2.id,
          },
        ],
      },
    },
  });

  // Create bookings for user2
  const booking4 = await prisma.booking.create({
    data: {
      title: "Website Design Review",
      description: "Professional review of website design",
      startTime: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(
        tomorrow.getTime() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000
      ),
      status: "CONFIRMED",
      attendeeName: "David Brown",
      attendeeEmail: "david@webdesign.com",
      attendeePhone: "+1-555-0321",
      notes: "New client, e-commerce website project",
      eventTypeId: eventType4.id,
      userId: user2.id,
      zoomUrl: "https://zoom.us/j/ghi789",
      customFieldValues: {
        create: [
          {
            value: "Modern",
            customFieldId: customField4.id,
          },
          {
            value: "Intermediate",
            customFieldId: customField5.id,
          },
        ],
      },
    },
  });

  console.log("✅ Sample bookings created");

  // Create blocked times
  console.log("🚫 Creating blocked times...");

  const blockedTime1 = await prisma.blockedTime.create({
    data: {
      startTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12 PM tomorrow
      endTime: new Date(tomorrow.getTime() + 13 * 60 * 60 * 1000), // 1 PM tomorrow
      reason: "Lunch break",
      userId: user1.id,
    },
  });

  const blockedTime2 = await prisma.blockedTime.create({
    data: {
      startTime: new Date(nextWeek.getTime() - 2 * 60 * 60 * 1000), // 2 hours before next week's booking
      endTime: new Date(nextWeek.getTime() - 1 * 60 * 60 * 1000), // 1 hour before next week's booking
      reason: "Preparation time",
      userId: user1.id,
    },
  });

  console.log("✅ Blocked times created");

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(
    `- Users: ${[user1.username, user2.username, user3.username].join(", ")}`
  );
  console.log(
    `- Event Types: ${[
      eventType1.title,
      eventType2.title,
      eventType3.title,
      eventType4.title,
      eventType5.title,
    ].join(", ")}`
  );
  console.log(
    `- Custom Fields: ${[
      customField1.name,
      customField2.name,
      customField3.name,
      customField4.name,
      customField5.name,
    ].join(", ")}`
  );
  console.log(
    `- Bookings: ${[
      booking1.title,
      booking2.title,
      booking3.title,
      booking4.title,
    ].join(", ")}`
  );
  console.log(`- Availability: Set for all users`);
  console.log(
    `- Blocked Times: ${[blockedTime1.reason, blockedTime2.reason].join(", ")}`
  );

  console.log("\n🔑 Test Credentials:");
  console.log("User 1: john@example.com / password123");
  console.log("User 2: jane@example.com / password123");
  console.log("User 3: mike@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
