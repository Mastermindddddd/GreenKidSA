import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

// POST /api/auth  — body: { action: "signup"|"login", name?, email, password }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const database = await connectDB();
    const users = database.collection("users");

    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const existing = await users.findOne({ email: email.toLowerCase() });
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await users.insertOne({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date(),
        balance: 0,
      });

      const token = jwt.sign(
        { userId: result.insertedId.toString(), email: email.toLowerCase(), name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: result.insertedId.toString(), name, email: email.toLowerCase() },
      });

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    if (action === "login") {
      const user = await users.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: user._id.toString(), name: user.name, email: user.email },
      });

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
  return response;
}

// GET /api/auth — get current user from cookie
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ user: null });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({
      user: { id: decoded.userId, name: decoded.name, email: decoded.email },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}