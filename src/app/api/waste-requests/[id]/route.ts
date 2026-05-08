import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import * as jwt from 'jsonwebtoken'

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret) as unknown as {
      userId: string
      name: string
      email: string
      role?: string
    }
  } catch {
    return null
  }
}

// GET /api/waste-requests/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })

    const db = await connectDB()
    const doc = await db.collection('waste_requests').findOne({ _id: new ObjectId(id) })

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Only allow the owner, a collector assigned to it, or an admin to view
    const isOwner = doc.userId === user.userId
    const isCollector = doc.collectorId === user.userId
    const isAdmin = user.role === 'admin' || user.role === 'dispatcher'

    if (!isOwner && !isCollector && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ request: { ...doc, _id: doc._id.toString() } })
  } catch (err) {
    console.error('GET /waste-requests/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/waste-requests/[id]
// Allowed body fields depend on caller role:
//   collector → status: 'in_progress' | 'collected'
//   admin/dispatcher → status: any, collectorId, assignedNote
//   owner → (read-only — cannot self-update status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromToken(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })

    const db = await connectDB()
    const col = db.collection('waste_requests')
    const doc = await col.findOne({ _id: new ObjectId(id) })

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const isAdmin = user.role === 'admin' || user.role === 'dispatcher'
    const isAssignedCollector = doc.collectorId === user.userId

    // Determine allowed transitions
    const COLLECTOR_TRANSITIONS: Record<string, string[]> = {
      pending:     ['in_progress'],
      in_progress: ['collected'],
      collected:   ['verified'],
    }

    const $set: Record<string, unknown> = { updatedAt: new Date() }

    if (isAdmin) {
      // Admins can set any status and reassign collector
      if (body.status) $set.status = body.status
      if (body.collectorId !== undefined) $set.collectorId = body.collectorId
      if (body.assignedNote) $set.assignedNote = body.assignedNote
    } else {
      // Collector picking up a pending task
      if (doc.status === 'pending' && body.status === 'in_progress') {
        $set.status = 'in_progress'
        $set.collectorId = user.userId
        $set.collectorName = user.name
      } else if (isAssignedCollector) {
        const allowed = COLLECTOR_TRANSITIONS[doc.status as string] ?? []
        if (!allowed.includes(body.status))
          return NextResponse.json(
            { error: `Cannot transition from '${doc.status}' to '${body.status}'` },
            { status: 400 }
          )
        $set.status = body.status
        if (body.status === 'verified') {
          $set.verifiedAt = new Date()
          $set.verificationImageUrl = body.verificationImageUrl ?? null
          $set.verificationResult = body.verificationResult ?? null
          $set.rewardTokens = body.rewardTokens ?? 0
        }
        if (body.status === 'collected') {
          $set.collectedAt = new Date()
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await col.updateOne({ _id: new ObjectId(id) }, { $set })
    const updated = await col.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      request: { ...updated, _id: updated!._id.toString() },
    })
  } catch (err) {
    console.error('PATCH /waste-requests/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}