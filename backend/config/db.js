import mongoose from "mongoose";  
import dotenv from "dotenv";
dotenv.config();
 

const URL=process.env.MONGO_MAIN_URI; 

const connectDB = async () => {
  try {
    await mongoose.connect(URL
, );
    console.log("✅ MongoDB Connected...");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
