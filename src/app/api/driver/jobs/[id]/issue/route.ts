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

// POST /api/driver/jobs/[id]/issue
// body: { issue: string }
// Logs a field issue against a job and flags it for dispatcher review.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issue } = await req.json();

    if (!issue || typeof issue !== "string" || issue.trim().length < 5) {
      return NextResponse.json(
        { error: "Issue description must be at least 5 characters" },
        { status: 400 }
      );
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");
    const notifications = database.collection("notifications");

    let jobId: ObjectId;
    try {
      jobId = new ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Append issue to the job's issue log
    await requests.updateOne(
      { _id: jobId },
      {
        $push: {
          issues: {
            reportedBy: user.userId,
            reporterName: user.name,
            description: issue.trim(),
            reportedAt: new Date(),
            resolved: false,
          },
        } as any,
        $set: {
          hasOpenIssue: true,
          updatedAt: new Date(),
        },
      }
    );

    // Create a notification for dispatchers (role: "dispatcher" or "admin")
    await notifications.insertOne({
      type: "field_issue",
      jobId: params.id,
      message: `Driver ${user.name} reported an issue: "${issue.trim()}"`,
      reportedBy: user.userId,
      targetRoles: ["dispatcher", "admin"],
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Issue reported to dispatcher.",
    });
  } catch (error) {
    console.error("Issue report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}