// Path: /app/api/driver/jobs/route.ts
// Endpoint: GET /api/driver/jobs

import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      name: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

// Simulate a distance/ETA calculation.
// In production replace with Google Maps Distance Matrix API.
function estimateDistanceAndEta(address: string) {
  // Very rough random-ish but deterministic values based on address length
  const seed = address.length % 10;
  const distanceKm = 1.0 + seed * 0.6;
  const etaMin = Math.round(distanceKm * 3.5);
  return { distanceKm: Math.round(distanceKm * 10) / 10, etaMin };
}

// GET /api/driver/jobs
// Returns all jobs assigned to the authenticated driver that are not yet completed.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    // Fetch jobs assigned to this driver OR all unassigned pending jobs if driver has no
    // dedicated assignment yet (admin can assign collectorId via admin dashboard).
    const query = {
      status: { $in: ["assigned", "en_route", "arrived", "collecting"] },
      $or: [
        { collectorId: user.userId },
        // Fallback: show pending jobs without a collector so drivers can self-assign
        { collectorId: null, status: "assigned" },
      ],
    };

    const jobs = await requests
      .find(query)
      .sort({ urgency: -1, preferredDate: 1, preferredTime: 1 })
      .limit(20)
      .toArray();

    // Enrich with distance/ETA
    const enriched = jobs.map((j) => {
      const { distanceKm, etaMin } = estimateDistanceAndEta(j.address || "");
      return {
        _id: j._id.toString(),
        address: j.address,
        location: j.location,
        wasteType: j.wasteType,
        amount: j.amount,
        urgency: j.urgency,
        preferredDate: j.preferredDate,
        preferredTime: j.preferredTime,
        contactPhone: j.contactPhone,
        description: j.description,
        status: j.status,
        userName: j.userName,
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