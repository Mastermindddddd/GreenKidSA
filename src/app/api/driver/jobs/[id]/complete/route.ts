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

// Points formula: base 10 pts + 1 pt per kg collected
function calculatePoints(weightKg: number, urgency: string): number {
  const base = 10;
  const kgBonus = Math.floor(weightKg);
  const urgencyBonus = urgency === "high" ? 5 : urgency === "normal" ? 2 : 0;
  return base + kgBonus + urgencyBonus;
}

// POST /api/driver/jobs/[id]/complete
// body: { weight: number, notes: string, imageUrls: string[] }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weight, notes, imageUrls } = await req.json();

    if (!weight || typeof weight !== "number" || weight <= 0) {
      return NextResponse.json({ error: "Valid weight is required" }, { status: 400 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");
    const rewards = database.collection("rewards");
    const users = database.collection("users");

    let jobId: ObjectId;
    try {
      jobId = new ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Fetch the job to get urgency for point calculation
    const job = await requests.findOne({ _id: jobId });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const pointsEarned = calculatePoints(weight, job.urgency || "normal");

    // Mark job as completed with proof
    await requests.updateOne(
      { _id: jobId },
      {
        $set: {
          status: "collected",
          collectorId: user.userId,
          collectorName: user.name,
          proof: {
            weightKg: weight,
            notes: notes || "",
            imageUrls: imageUrls || [],
            submittedAt: new Date(),
          },
          pointsAwarded: pointsEarned,
          updatedAt: new Date(),
          "timestamps.completed": new Date(),
        },
      }
    );

    // Create reward record
    await rewards.insertOne({
      userId: user.userId,
      userName: user.name,
      jobId: jobId.toString(),
      jobAddress: job.address,
      points: pointsEarned,
      type: "collection_completed",
      description: `Collected ${weight}kg of ${job.wasteType} waste at ${job.address}`,
      createdAt: new Date(),
    });

    // Increment driver's total points
    await users.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $inc: {
          totalPoints: pointsEarned,
          totalJobsCompleted: 1,
          totalKgCollected: weight,
        },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      success: true,
      pointsEarned,
      message: `Job completed! You earned ${pointsEarned} points.`,
    });
  } catch (error) {
    console.error("Job complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}