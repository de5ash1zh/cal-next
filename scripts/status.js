const { PrismaClient } = require("@prisma/client");
const http = require("http");

const prisma = new PrismaClient();
const PORT = 3000;
const HOST = "localhost";

async function checkDatabase() {
  console.log("🗄️ Checking database status...");

  try {
    // Check database connection
    await prisma.$connect();
    console.log("✅ Database connection: OK");

    // Get counts
    const userCount = await prisma.user.count();
    const eventTypeCount = await prisma.eventType.count();
    const bookingCount = await prisma.booking.count();
    const customFieldCount = await prisma.customField.count();
    const availabilityCount = await prisma.availability.count();
    const blockedTimeCount = await prisma.blockedTime.count();

    console.log(`📊 Database contents:`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📅 Event Types: ${eventTypeCount}`);
    console.log(`   📋 Bookings: ${bookingCount}`);
    console.log(`   🔧 Custom Fields: ${customFieldCount}`);
    console.log(`   ⏰ Availability Slots: ${availabilityCount}`);
    console.log(`   🚫 Blocked Times: ${blockedTimeCount}`);

    return true;
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
    return false;
  }
}

function checkApplication() {
  return new Promise((resolve) => {
    console.log("\n🌐 Checking application status...");

    const options = {
      hostname: HOST,
      port: PORT,
      path: "/",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log("✅ Application: RUNNING");
      console.log(`📍 URL: http://${HOST}:${PORT}`);
      console.log(`📊 Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        console.log("❌ Application: NOT RUNNING");
        console.log("💡 Start with: npm run dev");
      } else {
        console.log("❌ Application error:", error.message);
      }
      resolve(false);
    });

    req.on("timeout", () => {
      console.log("⏰ Application: STARTING UP");
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function showTestCredentials() {
  console.log("\n🔑 Test Credentials:");
  console.log("─".repeat(50));

  try {
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        username: true,
        bio: true,
      },
    });

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.username})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🔑 password123`);
      console.log(`   📝 ${user.bio}`);
      console.log("");
    });
  } catch (error) {
    console.log("❌ Could not fetch user data:", error.message);
  }
}

async function showQuickStart() {
  console.log("🚀 Quick Start Commands:");
  console.log("─".repeat(50));
  console.log("npm run dev          # Start development server");
  console.log("npm run seed         # Re-seed database");
  console.log("npm run test         # Run database tests");
  console.log("npm run check        # Check app status");
  console.log("npm run status       # Show this status");

  console.log("\n📱 Manual Testing:");
  console.log("─".repeat(50));
  console.log("1. Visit http://localhost:3000");
  console.log("2. Sign in with test credentials above");
  console.log("3. Navigate dashboard and test features");
  console.log("4. Create event types with custom fields");
  console.log("5. Test booking creation and management");
  console.log("6. Explore analytics dashboard");
  console.log("7. Test mobile responsiveness");
}

async function main() {
  console.log("🎯 CAL.COM CLONE - STATUS REPORT");
  console.log("=".repeat(60));

  const dbOk = await checkDatabase();
  const appOk = await checkApplication();

  console.log("\n📋 SUMMARY:");
  console.log("─".repeat(50));

  if (dbOk && appOk) {
    console.log("🎉 FULLY OPERATIONAL");
    console.log("✅ Database: Connected and seeded");
    console.log("✅ Application: Running and accessible");
    console.log("✅ Ready for testing and development");
  } else if (dbOk && !appOk) {
    console.log("⚠️  PARTIALLY OPERATIONAL");
    console.log("✅ Database: Connected and seeded");
    console.log("❌ Application: Not running");
    console.log("💡 Start the app with: npm run dev");
  } else if (!dbOk && appOk) {
    console.log("⚠️  PARTIALLY OPERATIONAL");
    console.log("❌ Database: Connection failed");
    console.log("✅ Application: Running");
    console.log("💡 Check database configuration");
  } else {
    console.log("❌ NOT OPERATIONAL");
    console.log("❌ Database: Connection failed");
    console.log("❌ Application: Not running");
    console.log("💡 Check setup and start services");
  }

  await showTestCredentials();
  await showQuickStart();

  console.log("\n" + "=".repeat(60));
  console.log("🎯 Status check completed!");

  if (dbOk && appOk) {
    console.log("🚀 Your Cal.com clone is ready to use!");
  }
}

main()
  .catch((error) => {
    console.error("❌ Status check failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
