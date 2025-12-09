import mongoose from "mongoose";

const DB1_URL = process.env.MONGO_MAIN_URI;   // includes DB1 name
const DB2_URL = process.env.DB2_URL;          // includes DB2 name

export const connectDB1 = mongoose.createConnection(DB1_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const connectDB2 = mongoose.createConnection(DB2_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 🟢 DB1 logs
connectDB1.on("connected", () => {
  console.log("🟢 DB1 Connected:", DB1_URL);
});
connectDB1.on("error", (err) => {
  console.log("🔴 DB1 Error:", err);
});

// 🟢 DB2 logs
connectDB2.on("connected", () => {
  console.log("🟢 DB2 Connected:", DB2_URL);
});
connectDB2.on("error", (err) => {
  console.log("🔴 DB2 Error:", err);
});
