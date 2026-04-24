import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";
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

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database = await connectDB();
    const requests = database.collection("waste_requests");

    const docs = await requests
      .find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .toArray();

    const headers = [
      "ID", "Resident", "Email", "Address", "Location",
      "Waste Type", "Amount", "Urgency", "Status",
      "Driver", "Weight Collected (kg)", "Created At", "Completed At",
    ];

    const rows = docs.map((r) => [
      r._id.toString(),
      r.userName,
      r.userEmail,
      r.address,
      r.location,
      r.wasteType,
      r.amount,
      r.urgency,
      r.status,
      r.collectorName ?? "",
      r.proof?.weightKg ?? "",
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
      r.timestamps?.completed ? new Date(r.timestamps.completed).toISOString() : "",
    ].map(escapeCSV));

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="greenkidsa-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}