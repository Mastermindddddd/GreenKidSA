import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as jwt from "jsonwebtoken";

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
      userId: string;
      name: string;
      email: string;
    };
  } catch {
    return null;
  }
}

// GET /api/driver/summary
// Returns today's shift statistics for the authenticated driver.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");
    const rewards = database.collection("rewards");

    // Build date range for "today"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Jobs assigned to this driver today
    const todayJobs = await requests
      .find({
        collectorId: user.userId,
        updatedAt: { $gte: startOfDay, $lte: endOfDay },
      })
      .toArray();

    const completed = todayJobs.filter((j) => j.status === "collected");
    const kgCollected = completed.reduce((sum, j) => sum + (j.proof?.weightKg || 0), 0);

    // Points earned today
    const todayRewards = await rewards
      .find({
        userId: user.userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })
      .toArray();
    const pointsToday = todayRewards.reduce((sum, r) => sum + (r.points || 0), 0);

    // All-time stats from user record
    const users = database.collection("users");
    let userRecord: { totalPoints?: number; totalJobsCompleted?: number } = {};
    try {
      const found = await users.findOne({ _id: new ObjectId(user.userId) });
      if (found) {
        userRecord = {
          totalPoints: found.totalPoints as number | undefined,
          totalJobsCompleted: found.totalJobsCompleted as number | undefined,
        };
      }
    } catch {
      // ObjectId parse may fail for non-Mongo IDs — gracefully ignore
    }

    // On-time rate: jobs where en_route → arrived within preferredTime window
    // Simplified: count jobs completed without open issues as "on time"
    const onTimeCount = completed.filter((j) => !j.hasOpenIssue).length;
    const onTimeRate =
      completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 100;

    return NextResponse.json({
      summary: {
        completed: completed.length,
        total: todayJobs.length,
        kgCollected: Math.round(kgCollected * 10) / 10,
        points: pointsToday,
        onTimeRate,
        allTimePoints: userRecord.totalPoints ?? 0,
        allTimeJobs: userRecord.totalJobsCompleted ?? 0,
      },
    });
  } catch (error) {
    console.error("Driver summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}