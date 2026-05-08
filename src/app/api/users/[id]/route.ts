import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import * as jwt from 'jsonwebtoken'

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
      userId: string; role?: string
    }
  } catch { return null }
}

// GET /api/users/[id]
// Returns a safe public profile — never exposes passwordHash.
// Any authenticated user can view a driver profile (needed for "my-requests" driver card).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = getUserFromToken(req)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    const db = await connectDB()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          passwordHash: 0,   // never expose
          __v: 0,
        },
      }
    )

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Determine online status: active within last 5 minutes
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0
    const isOnline = Date.now() - lastActive < ONLINE_THRESHOLD_MS

    return NextResponse.json({
      user: {
        id:                 user._id.toString(),
        name:               user.name,
        email:              user.email,
        role:               user.role,
        totalPoints:        user.totalPoints        ?? 0,
        totalJobsCompleted: user.totalJobsCompleted ?? 0,
        totalKgCollected:   user.totalKgCollected   ?? 0,
        lastActiveAt:       user.lastActiveAt       ?? null,
        createdAt:          user.createdAt          ?? null,
        isOnline,
      },
    })
  } catch (err) {
    console.error('GET /api/users/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}