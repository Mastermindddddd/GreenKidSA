import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import * as jwt from "jsonwebtoken";

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as unknown as { userId: string; name: string; email: string };
  } catch {
    return null;
  }
}

// POST /api/waste-requests — create a new waste collection request
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      wasteType,
      amount,
      location,
      address,
      description,
      preferredDate,
      preferredTime,
      imageUrls,      // array of S3 public URLs
      urgency,
      contactPhone,
    } = body;

    if (!wasteType || !location || !address) {
      return NextResponse.json(
        { error: "wasteType, location, and address are required" },
        { status: 400 }
      );
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    const doc = {
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      wasteType,
      amount: amount || "Unknown",
      location,           // human-readable area / suburb
      address,            // full street address
      description: description || "",
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      urgency: urgency || "normal",   // "low" | "normal" | "high"
      contactPhone: contactPhone || "",
      imageUrls: imageUrls || [],     // array of S3 URLs
      status: "pending",              // pending → assigned → collected → verified
      collectorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await requests.insertOne(doc);

    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
      message: "Waste collection request submitted successfully",
    });
  } catch (error) {
    console.error("Waste request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/waste-requests — fetch requests for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await connectDB();
    const requests = database.collection("waste_requests");

    const userRequests = await requests
      .find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ requests: userRequests });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}