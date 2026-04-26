// Path: /app/api/admin/drivers/route.ts
// Endpoint: GET /api/admin/drivers
//
// DRIVER PRESENCE LOGIC
// ─────────────────────
// A driver's status is derived from lastActiveAt, which is written in three places:
//
//   1. POST /api/auth (login)         → set to now
//   2. GET  /api/auth (session check) → set to now (AuthContext calls this on load)
//   3. GET  /api/driver/jobs          → set to now (useDriverJobs hook polls every 60s)
//   4. DELETE /api/auth (logout)      → set to epoch (1970), forces offline immediately
//
// Status thresholds:
//   active  → lastActiveAt within the last 10 minutes
//   idle    → lastActiveAt within the last 2 hours
//   offline → lastActiveAt older than 2 hours, or never set
//
// This means a driver shows as "active" as long as they have the app open
// (AuthContext re-checks the session on every navigation), and "idle" if
// the app is open but they haven't fetched jobs recently.

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import * as jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

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

const ACTIVE_MS = 10 * 60 * 1000;   // 10 minutes  → "active"
const IDLE_MS   =  2 * 60 * 60 * 1000; // 2 hours  → "idle"

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
      .sort({ lastActiveAt: -1, totalJobsCompleted: -1 })
      .limit(100)
      .toArray();

    // Find active (in-progress) jobs for each driver
    const driverIds = drivers.map((d) => d._id.toString());
    const activeJobs = await requests
      .find({
        status:      { $in: ["en_route", "arrived", "collecting"] },
        collectorId: { $in: driverIds },
      })
      .project({ collectorId: 1, address: 1 })
      .toArray();

    const activeJobMap: Record<string, string> = {};
    for (const job of activeJobs) {
      activeJobMap[job.collectorId] = job.address;
    }

    const now = Date.now();

    const enriched = drivers.map((d) => {
      const driverId   = d._id.toString();
      const lastActive = d.lastActiveAt ? new Date(d.lastActiveAt).getTime() : 0;
      const elapsed    = now - lastActive;

      let status: "active" | "idle" | "offline";
      if (elapsed <= ACTIVE_MS)  status = "active";
      else if (elapsed <= IDLE_MS) status = "idle";
      else                       status = "offline";

      return {
        _id:                driverId,
        name:               d.name,
        email:              d.email,
        totalJobsCompleted: d.totalJobsCompleted ?? 0,
        totalKgCollected:   d.totalKgCollected   ?? 0,
        totalPoints:        d.totalPoints        ?? 0,
        activeJob:          activeJobMap[driverId] ?? null,
        status,
        lastActiveAt:       d.lastActiveAt ?? null,
      };
    });

    return NextResponse.json({ drivers: enriched });
  } catch (error) {
    console.error("Admin drivers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}