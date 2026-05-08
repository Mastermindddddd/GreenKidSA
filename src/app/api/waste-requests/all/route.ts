import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import * as jwt from 'jsonwebtoken'

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret) as unknown as {
      userId: string; name: string; email: string; role?: string
    }
  } catch {
    return null
  }
}

// GET /api/waste-requests/all
// Returns all requests visible to collectors (pending + in_progress + collected + verified)
// Collectors see the full board; their own in_progress task is highlighted client-side.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await connectDB()

    const requests = await db
      .collection('waste_requests')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    const serialised = requests.map(r => ({
      ...r,
      _id: r._id.toString(),
    }))

    return NextResponse.json({ requests: serialised })
  } catch (err) {
    console.error('GET /waste-requests/all', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}