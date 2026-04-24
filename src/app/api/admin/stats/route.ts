import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

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

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database = await connectDB();
    const requests  = database.collection("waste_requests");
    const users     = database.collection("users");
    const trucks    = database.collection("trucks");
    const notifs    = database.collection("notifications");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [
      totalRequests,
      pendingRequests,
      assignedRequests,
      completedToday,
      completedYesterday,
      totalDrivers,
      activeDrivers,
      totalTrucks,
      trucksOnRoute,
      openIssues,
    ] = await Promise.all([
      requests.countDocuments(),
      requests.countDocuments({ status: "pending" }),
      requests.countDocuments({ status: "assigned" }),
      requests.countDocuments({ status: "collected", "timestamps.completed": { $gte: startOfDay } }),
      requests.countDocuments({ status: "collected", "timestamps.completed": { $gte: startOfYesterday, $lt: startOfDay } }),
      users.countDocuments({ role: "driver" }),
      users.countDocuments({ role: "driver", lastActiveAt: { $gte: new Date(Date.now() - 8 * 60 * 60 * 1000) } }),
      trucks.countDocuments(),
      trucks.countDocuments({ status: "on_route" }),
      requests.countDocuments({ hasOpenIssue: true }),
    ]);

    // kg collected today
    const collectedTodayDocs = await requests
      .find({ status: "collected", "timestamps.completed": { $gte: startOfDay } })
      .project({ "proof.weightKg": 1 })
      .toArray();
    const kgCollectedToday = collectedTodayDocs.reduce((sum, d) => sum + (d.proof?.weightKg || 0), 0);

    const requestsTrend = completedYesterday > 0
      ? Math.round(((completedToday - completedYesterday) / completedYesterday) * 100)
      : 0;

    const completionRate = totalRequests > 0
      ? Math.round(((await requests.countDocuments({ status: "collected" })) / totalRequests) * 100)
      : 0;

    return NextResponse.json({
      totalRequests,
      pendingRequests,
      assignedRequests,
      completedToday,
      totalDrivers,
      activeDrivers,
      totalTrucks,
      trucksOnRoute,
      kgCollectedToday: Math.round(kgCollectedToday * 10) / 10,
      openIssues,
      requestsTrend,
      completionRate,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}