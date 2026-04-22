import mongoose from "mongoose";

declare global {
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

globalThis.__mongooseConn ??= { conn: null, promise: null };

export async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  if (globalThis.__mongooseConn.conn) return globalThis.__mongooseConn.conn;

  globalThis.__mongooseConn.promise ??= mongoose.connect(MONGODB_URI as string, {
    dbName: undefined,
  });

  globalThis.__mongooseConn.conn = await globalThis.__mongooseConn.promise;
  return globalThis.__mongooseConn.conn;
}

