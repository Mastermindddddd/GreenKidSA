import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as { userId: string; role?: string }
  } catch { return null }
}

// GET /api/users/[id] — (existing, unchanged)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = getUserFromToken(req)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    const db   = await connectDB()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0, __v: 0 } }
    )

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0
    const isOnline   = Date.now() - lastActive < ONLINE_THRESHOLD_MS

    return NextResponse.json({
      user: {
        id:                 user._id.toString(),
        name:               user.name,
        email:              user.email,
        role:               user.role,
        phone:              user.phone              ?? '',
        address:            user.address            ?? '',
        notifications:      user.notifications      ?? true,
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

// PUT /api/users/[id] — update own profile
// Users can only update their own profile. Admins can update any profile.
// Email and role are intentionally NOT updatable here.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = getUserFromToken(req)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    // Only allow updating your own profile (unless you're admin)
    if (caller.userId !== id && caller.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Whitelist updatable fields — never allow role, email, or passwordHash
    const allowedFields: Record<string, unknown> = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      allowedFields.name = body.name.trim()
    }
    if (typeof body.phone === 'string') {
      allowedFields.phone = body.phone.trim()
    }
    if (typeof body.address === 'string') {
      allowedFields.address = body.address.trim()
    }
    if (typeof body.notifications === 'boolean') {
      allowedFields.notifications = body.notifications
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    allowedFields.updatedAt = new Date()

    const db = await connectDB()
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: allowedFields },
      {
        returnDocument: 'after',
        projection: { passwordHash: 0, __v: 0 },
      }
    )

    if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      user: {
        id:           result._id.toString(),
        name:         result.name,
        email:        result.email,
        role:         result.role,
        phone:        result.phone         ?? '',
        address:      result.address       ?? '',
        notifications: result.notifications ?? true,
      },
    })
  } catch (err) {
    console.error('PUT /api/users/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}