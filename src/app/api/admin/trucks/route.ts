import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import * as jwt from "jsonwebtoken";

function isAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { role?: string };
    return payload.role === "admin" || payload.role === "dispatcher";
  } catch {
    return false;
  }
}

// GET /api/admin/trucks
// Returns the full truck fleet with current status and load.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database = await connectDB();
    const trucks   = database.collection("trucks");

    const docs = await trucks
      .find({})
      .sort({ status: 1, plate: 1 })
      .toArray();

    return NextResponse.json({
      trucks: docs.map((t) => ({
        _id:            t._id.toString(),
        plate:          t.plate,
        model:          t.model,
        status:         t.status,
        driverName:     t.driverName  ?? null,
        lastLocation:   t.lastLocation ?? null,
        capacityKg:     t.capacityKg,
        currentLoadKg:  t.currentLoadKg ?? 0,
      })),
    });
  } catch (error) {
    console.error("Admin trucks GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/trucks
// Registers a new truck in the fleet.
// body: { plate, model, capacityKg }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { plate, model, capacityKg } = await req.json();

    if (!plate || !model || !capacityKg) {
      return NextResponse.json(
        { error: "plate, model, and capacityKg are required" },
        { status: 400 }
      );
    }

    const database = await connectDB();
    const trucks   = database.collection("trucks");

    const existing = await trucks.findOne({ plate: plate.toUpperCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "A truck with this plate already exists" }, { status: 409 });
    }

    const result = await trucks.insertOne({
      plate:        plate.toUpperCase().trim(),
      model:        model.trim(),
      capacityKg:   Number(capacityKg),
      currentLoadKg: 0,
      status:       "available",
      driverName:   null,
      lastLocation: null,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });

    return NextResponse.json({ success: true, truckId: result.insertedId.toString() });
  } catch (error) {
    console.error("Admin trucks POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}