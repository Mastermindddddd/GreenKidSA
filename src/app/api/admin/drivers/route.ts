import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";
import * as jwt from "jsonwebtoken";

const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

let client: MongoClient;
let db: Db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("greenkidsa");
  }
  return db;
}

function isAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
    return payload.role === "admin" || payload.role === "dispatcher";
  } catch {
    return false;
  }
}

// GET /api/admin/drivers
// Returns all driver users enriched with their current active job address (if any).
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database = await connectDB();
    const users    = database.collection("users");
    const requests = database.collection("waste_requests");

    const drivers = await users
      .find({ role: "driver" })
      .sort({ totalJobsCompleted: -1 })
      .limit(100)
      .toArray();

    // Find any in-progress jobs for each driver
    const activeJobs = await requests
      .find({
        status: { $in: ["en_route", "arrived", "collecting"] },
        collectorId: { $in: drivers.map((d) => d._id.toString()) },
      })
      .project({ collectorId: 1, address: 1 })
      .toArray();

    const activeJobMap: Record<string, string> = {};
    for (const job of activeJobs) {
      activeJobMap[job.collectorId] = job.address;
    }

    // Determine driver status based on last activity
    const now = Date.now();
    const ACTIVE_THRESHOLD_MS  = 8  * 60 * 60 * 1000; // 8 hours
    const IDLE_THRESHOLD_MS    = 24 * 60 * 60 * 1000; // 24 hours

    const enriched = drivers.map((d) => {
      const driverId = d._id.toString();
      const lastActive = d.lastActiveAt ? new Date(d.lastActiveAt).getTime() : 0;
      const timeSince  = now - lastActive;

      let status: "active" | "idle" | "offline" = "offline";
      if (activeJobMap[driverId])            status = "active";
      else if (timeSince < ACTIVE_THRESHOLD_MS) status = "active";
      else if (timeSince < IDLE_THRESHOLD_MS)   status = "idle";

      return {
        _id: driverId,
        name: d.name,
        email: d.email,
        totalJobsCompleted: d.totalJobsCompleted ?? 0,
        totalKgCollected:   d.totalKgCollected   ?? 0,
        totalPoints:        d.totalPoints        ?? 0,
        activeJob:          activeJobMap[driverId] ?? null,
        status,
      };
    });

    return NextResponse.json({ drivers: enriched });
  } catch (error) {
    console.error("Admin drivers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}