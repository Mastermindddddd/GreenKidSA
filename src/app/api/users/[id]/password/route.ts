import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as { userId: string; role?: string }
  } catch { return null }
}

// PUT /api/users/[id]/password — change own password
// Requires currentPassword for verification. Only the account owner can change it.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = getUserFromToken(req)
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    // Only the account owner can change their own password
    if (caller.userId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db   = await connectDB()
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const match = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PUT /api/users/[id]/password', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}