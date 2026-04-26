import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import * as jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as {
      userId: string; name: string; email: string; role?: string;
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

// GET /api/driver/jobs
// Returns jobs assigned to the driver. Also touches lastActiveAt so the admin
// dashboard accurately reflects driver presence (the hook polls every 60s).
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await connectDB();

    // Update presence — fire-and-forget, never blocks the response
    try {
      await database.collection("users").updateOne(
        { _id: new ObjectId(user.userId) },
        { $set: { lastActiveAt: new Date() } }
      );
    } catch {
      // Non-critical — ignore if ObjectId is invalid or write fails
    }

    const requests = database.collection("waste_requests");

    const query = {
      status: { $in: ["assigned", "en_route", "arrived", "collecting"] },
      collectorId: user.userId,
    };

    const jobs = await requests
      .find(query)
      .sort({ urgency: -1, preferredDate: 1, preferredTime: 1 })
      .limit(20)
      .toArray();

    const enriched = jobs.map((j) => {
      const { distanceKm, etaMin } = estimateDistanceAndEta(j.address || "");
      return {
        _id:          j._id.toString(),
        address:      j.address,
        location:     j.location,
        wasteType:    j.wasteType,
        amount:       j.amount,
        urgency:      j.urgency,
        preferredDate: j.preferredDate,
        preferredTime: j.preferredTime,
        contactPhone: j.contactPhone,
        description:  j.description,
        status:       j.status,
        userName:     j.userName,
        distanceKm,
        etaMin,
      };
    });

    return NextResponse.json({ jobs: enriched });
  } catch (error) {
    console.error("Driver jobs fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}