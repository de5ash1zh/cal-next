const http = require("http");

const PORT = 3000;
const HOST = "localhost";

function checkApp() {
  console.log("🔍 Checking if the application is running...");

  const options = {
    hostname: HOST,
    port: PORT,
    path: "/",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Application is running!`);
    console.log(`📍 URL: http://${HOST}:${PORT}`);
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`🔗 Headers: ${JSON.stringify(res.headers, null, 2)}`);

    if (res.statusCode === 200) {
      console.log("\n🎉 Ready to use! You can now:");
      console.log("1. Open http://localhost:3000 in your browser");
      console.log("2. Sign in with test credentials:");
      console.log("   - john@example.com / password123");
      console.log("   - jane@example.com / password123");
      console.log("   - mike@example.com / password123");
      console.log("3. Explore the dashboard and features");
    }
  });

  req.on("error", (error) => {
    if (error.code === "ECONNREFUSED") {
      console.log("❌ Application is not running");
      console.log("💡 Start it with: npm run dev");
    } else {
      console.log("❌ Error checking application:", error.message);
    }
  });

  req.on("timeout", () => {
    console.log("⏰ Request timed out - application might be starting up");
    req.destroy();
  });

  req.end();
}

// Run the check
checkApp();
