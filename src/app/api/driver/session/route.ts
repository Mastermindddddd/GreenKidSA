import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as jwt from "jsonwebtoken";

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as unknown as {
      userId: string;
      name: string;
      email: string;
    };
  } catch {
    return null;
  }
}

function estimateDistanceAndEta(address: string) {
  const seed = address.length % 10;
  const distanceKm = 1.0 + seed * 0.6;
  const etaMin = Math.round(distanceKm * 3.5);
  return { distanceKm: Math.round(distanceKm * 10) / 10, etaMin };
}

/**
 * GET /api/driver/session
 *
 * Returns the driver's currently active job (status: en_route | arrived | collecting)
 * along with how many seconds have elapsed since the trip started (timestamps.enRoute).
 *
 * Used on page mount so drivers can seamlessly resume after refresh or app close.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    // Find the most recent active job for this driver
    const activeJob = await requests.findOne(
      {
        collectorId: user.userId,
        status: { $in: ["en_route", "arrived", "collecting"] },
      },
      { sort: { "timestamps.enRoute": -1 } }
    );

    if (!activeJob) {
      return NextResponse.json({ activeJob: null, elapsedSeconds: 0 });
    }

    // Calculate elapsed seconds from when the trip started
    const enRouteAt: Date | undefined = activeJob.timestamps?.enRoute;
    const elapsedSeconds = enRouteAt
      ? Math.floor((Date.now() - new Date(enRouteAt).getTime()) / 1000)
      : 0;

    const { distanceKm, etaMin } = estimateDistanceAndEta(activeJob.address || "");

    return NextResponse.json({
      activeJob: {
        _id:           activeJob._id.toString(),
        address:       activeJob.address,
        location:      activeJob.location,
        wasteType:     activeJob.wasteType,
        amount:        activeJob.amount,
        urgency:       activeJob.urgency,
        preferredDate: activeJob.preferredDate,
        preferredTime: activeJob.preferredTime,
        contactPhone:  activeJob.contactPhone,
        description:   activeJob.description,
        status:        activeJob.status,
        userName:      activeJob.userName,
        distanceKm,
        etaMin,
      },
      elapsedSeconds,
    });
  } catch (error) {
    console.error("Driver session fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/driver/session
 *
 * Persists checklist state for the active job so the driver can resume
 * mid-checklist after a refresh.
 *
 * body: { jobId: string, checks: boolean[] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, checks } = await req.json();

    if (!jobId || !Array.isArray(checks)) {
      return NextResponse.json({ error: "jobId and checks are required" }, { status: 400 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    let oid: ObjectId;
    try { oid = new ObjectId(jobId); } catch {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    await requests.updateOne(
      { _id: oid, collectorId: user.userId },
      { $set: { "driverProgress.checks": checks, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session patch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}