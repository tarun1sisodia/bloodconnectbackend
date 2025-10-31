import mongoose from "mongoose";
import dotenv from "dotenv";
import { environmentConfig } from "../config/environment.js";
dotenv.config();
const connectDB = async () => {
  try {
    // Connect to MongoDB with enhanced configuration
    const dbConfig = environmentConfig.getDatabaseConfig();
    const connectionInstance = await mongoose.connect(
      //   `${process.env.MONGODB_URI}`
      dbConfig.uri
    );
    console.log(`Database: ${connectionInstance.connection.name}`);
    console.log(`HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", err);
    // process.exit(1);
  }
};

export { connectDB };
