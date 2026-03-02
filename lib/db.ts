// lib/db.ts – MongoDB connection with connection pooling
import UserModel from "@/models/User";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// Cache the connection across hot-reloads in dev and across serverless invocations
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

const globalCache: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

global._mongooseCache = globalCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (globalCache.conn) return globalCache.conn;

  if (!globalCache.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    globalCache.promise = mongoose.connect(MONGODB_URI, opts).then((mg) => {
      console.log("✅ MongoDB connected");
      return mg;
    });
  }

  globalCache.conn = await globalCache.promise;

//   console.log("DB Name:", mongoose.connection.name);
// console.log("User count:", await UserModel.countDocuments());
  return globalCache.conn;
}

export default connectDB;
