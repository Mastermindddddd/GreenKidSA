import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import * as jwt from "jsonwebtoken";

function isAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role?: string };
    return payload.role === "admin" || payload.role === "dispatcher";
  } catch {
    return false;
  }
}

// GET /api/admin/activity
// Returns the 100 most recent system events merged from notifications and rewards.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database     = await connectDB();
    const notifications = database.collection("notifications");
    const rewards       = database.collection("rewards");
    const requests      = database.collection("waste_requests");

    // Pull from multiple collections and merge
    const [notifDocs, rewardDocs, statusChanges] = await Promise.all([
      notifications
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),

      rewards
        .find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray(),

      // Recent status changes on requests (any updated in last 24h)
      requests
        .find({ updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort({ updatedAt: -1 })
        .limit(30)
        .project({ status: 1, address: 1, collectorName: 1, updatedAt: 1, hasOpenIssue: 1 })
        .toArray(),
    ]);

    const events: { _id: string; type: string; message: string; createdAt: Date }[] = [];

    for (const n of notifDocs) {
      events.push({
        _id:       n._id.toString(),
        type:      n.type,
        message:   n.message,
        createdAt: n.createdAt,
      });
    }

    for (const r of rewardDocs) {
      events.push({
        _id:       r._id.toString(),
        type:      "collection_completed",
        message:   `${r.userName} completed a collection and earned ${r.points} pts — ${r.jobAddress}`,
        createdAt: r.createdAt,
      });
    }

    for (const sc of statusChanges) {
      events.push({
        _id:       sc._id.toString() + "_status",
        type:      "status_change",
        message:   `Request at ${sc.address} is now "${sc.status}"${sc.collectorName ? ` (driver: ${sc.collectorName})` : ""}`,
        createdAt: sc.updatedAt,
      });
    }

    // Sort all by date descending and return top 100
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activity: events.slice(0, 100) });
  } catch (error) {
    console.error("Admin activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}