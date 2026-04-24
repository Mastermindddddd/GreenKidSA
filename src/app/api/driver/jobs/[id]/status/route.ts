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
    };
  } catch {
    return null;
  }
}

const VALID_STATUSES = ["en_route", "arrived", "collecting", "completed"] as const;

// PATCH /api/driver/jobs/[id]/status
// body: { status: "en_route" | "arrived" | "collecting" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    let jobId: ObjectId;
    try {
      jobId = new ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    // Record timestamps for each stage transition
    if (status === "en_route") {
      updateFields["timestamps.enRoute"] = new Date();
      updateFields["collectorId"] = user.userId;
      updateFields["collectorName"] = user.name;
    } else if (status === "arrived") {
      updateFields["timestamps.arrived"] = new Date();
    } else if (status === "collecting") {
      updateFields["timestamps.collectingStarted"] = new Date();
    }

    const result = await requests.updateOne(
      { _id: jobId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}