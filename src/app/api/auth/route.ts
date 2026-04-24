import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function makeToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function setCookie(res: NextResponse, token: string) {
  res.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

// GET /api/auth — verify current session
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ user: null });

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string; name: string; email: string; role: string;
    };

    return NextResponse.json({
      user: { id: payload.userId, name: payload.name, email: payload.email, role: payload.role || "user" },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// POST /api/auth — login or signup
export async function POST(req: NextRequest) {
  try {
    const { action, name, email, password } = await req.json();
    const database = await connectDB();
    const users    = database.collection("users");

    if (action === "login") {
      const user = await users.findOne({ email: email.toLowerCase().trim() });
      if (!user) return NextResponse.json({ error: "No account found with that email" }, { status: 401 });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

      const token = makeToken({ userId: user._id.toString(), name: user.name, email: user.email, role: user.role || "user" });
      const res   = NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role || "user" } });
      setCookie(res, token);
      return res;
    }

    if (action === "signup") {
      if (!name || !email || !password)
        return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });

      const existing = await users.findOne({ email: email.toLowerCase().trim() });
      if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

      const passwordHash = await bcrypt.hash(password, 12);
      const result = await users.insertOne({
        name: name.trim(), email: email.toLowerCase().trim(), passwordHash,
        role: "user", totalPoints: 0, totalJobsCompleted: 0, totalKgCollected: 0,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const token = makeToken({ userId: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase().trim(), role: "user" });
      const res   = NextResponse.json({ user: { id: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase().trim(), role: "user" } });
      setCookie(res, token);
      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
  return res;
}