
const dotenv = require("dotenv");
const app = require("./index");
const { connectDB } = require("./config/db");

// Load environment file
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

// Connect DB
connectDB();

// In production (cPanel Passenger), do NOT start the server manually
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} on http://localhost:${PORT}`);
  });
} else {
  console.log("✅ Production environment detected: Passenger will manage the server.");
}

// Optional: error logging
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
});

module.exports = app; // still export app for Passenger
