import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db, ObjectId } from "mongodb";
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

// PATCH /api/admin/assign
// Assigns a waste request to a driver. Admin/dispatcher only.
// body: { requestId: string, driverId: string, driverName: string }
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and dispatchers can assign jobs
    if (user.role !== "admin" && user.role !== "dispatcher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { requestId, driverId, driverName } = await req.json();

    if (!requestId || !driverId) {
      return NextResponse.json(
        { error: "requestId and driverId are required" },
        { status: 400 }
      );
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    let jobId: ObjectId;
    try {
      jobId = new ObjectId(requestId);
    } catch {
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
    }

    const result = await requests.updateOne(
      { _id: jobId, status: "pending" },
      {
        $set: {
          collectorId: driverId,
          collectorName: driverName || "Unknown",
          status: "assigned",
          assignedAt: new Date(),
          assignedBy: user.userId,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Job not found or already assigned" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Job assigned to driver ${driverName || driverId}`,
    });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/assign
// Lists all pending (unassigned) waste requests for the admin dashboard.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "dispatcher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    const pending = await requests
      .find({ status: "pending" })
      .sort({ urgency: -1, createdAt: 1 })
      .limit(100)
      .toArray();

    const assigned = await requests
      .find({ status: { $in: ["assigned", "en_route", "arrived", "collecting"] } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      pending: pending.map((r) => ({ ...r, _id: r._id.toString() })),
      assigned: assigned.map((r) => ({ ...r, _id: r._id.toString() })),
    });
  } catch (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}