// Shared MongoDB connection utility used by all API routes.
//
// WHY THIS EXISTS:
// Inlining `let client: MongoClient` in each route file causes a subtle bug:
// if `client.connect()` throws (e.g. timeout, bad URI, IP not whitelisted),
// `client` is already assigned but `db` is still undefined. The next request
// sees `client` truthy, skips `connect()`, and crashes trying to call
// `.collection()` on undefined. This module fixes that by clearing both
// references on failure so every retry starts from scratch.
//
// COMMON CAUSES OF MongoServerSelectionError / timeout:
//   1. Your IP is not whitelisted in Atlas → Network Access → Add IP Address
//      (use 0.0.0.0/0 to allow all IPs during development)
//   2. MONGODB_URI is wrong — must be:
//      mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
//      Special characters in passwords must be URL-encoded (@ → %40, # → %23, etc.)
//   3. The Atlas cluster is paused (free tier pauses after 60 days of inactivity)
//   4. Running inside a network/firewall that blocks outbound port 27017

import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME     = process.env.MONGODB_DB ?? "greenkidsa";

if (!MONGODB_URI) {
  throw new Error("Missing environment variable: MONGODB_URI");
}

// Module-level singletons — reset to null on any connection failure
// so the next request retries from scratch rather than calling .collection()
// on an undefined db reference.
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  // Already connected
  if (db) return db;

  const newClient = new MongoClient(MONGODB_URI, {
    // Fail quickly in development so you see errors fast instead of waiting 30s
    serverSelectionTimeoutMS: process.env.NODE_ENV === "production" ? 30_000 : 10_000,
    connectTimeoutMS:         process.env.NODE_ENV === "production" ? 30_000 : 10_000,
  });

  try {
    await newClient.connect();
    client = newClient;
    db     = client.db(DB_NAME);
    return db;
  } catch (err) {
    // Reset so the next request retries cleanly
    client = null;
    db     = null;
    // Close the failed client to free the socket
    await newClient.close().catch(() => {});
    throw err;
  }
}

// Optional: call this in a graceful shutdown handler
export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db     = null;
  }
}