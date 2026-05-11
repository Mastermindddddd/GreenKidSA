'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Leaf, Clock, CheckCircle, Trash2, Package, BadgeCheck,
  MapPin, Calendar, Weight, Loader2, RefreshCw, ChevronDown,
  ChevronUp, Camera, Zap, Plus, User, Star, Briefcase,
  CircleDot, Mail, Navigation, FileDown, Truck,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
// `status` is the simplified 4-step user view; `driverStage` is the raw DB value
type UserStatus = 'pending' | 'in_progress' | 'collected' | 'verified' | 'cancelled'

interface WasteRequest {
  _id: string
  wasteType: string
  amount: string
  location: string
  address: string
  description: string
  preferredDate: string | null
  preferredTime: string | null
  urgency: 'low' | 'normal' | 'high'
  contactPhone: string
  imageUrls: string[]
  // Simplified user-facing status (4 steps)
  status: UserStatus
  // Raw driver-side status for the detail label
  driverStage?: string
  collectorId: string | null
  collectorName?: string
  createdAt: string
  updatedAt: string
  verifiedAt?: string
  rewardTokens?: number
  proof?: {
    weightKg: number
    notes: string
    imageUrls: string[]
    submittedAt: string
  }
}

interface DriverProfile {
  id: string
  name: string
  email: string
  role: string
  totalPoints: number
  totalJobsCompleted: number
  totalKgCollected: number
  lastActiveAt: string | null
  createdAt: string | null
  isOnline: boolean
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<UserStatus, {
  label: string; color: string; bg: string; border: string
  Icon: any; desc: string; step: number
}> = {
  pending:     { label: 'Pending',     color: '#b45309', bg: '#fef3c7', border: '#fde68a', Icon: Clock,      desc: 'Awaiting a collector',            step: 1 },
  in_progress: { label: 'In Progress', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', Icon: Truck,      desc: 'Collector en route / collecting',  step: 2 },
  collected:   { label: 'Collected',   color: '#047857', bg: '#d1fae5', border: '#a7f3d0', Icon: Package,    desc: 'Waste collected, pending AI check', step: 3 },
  verified:    { label: 'Verified ✓',  color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', Icon: BadgeCheck, desc: 'Verified & complete',               step: 4 },
  cancelled:   { label: 'Cancelled',   color: '#991b1b', bg: '#fee2e2', border: '#fecaca', Icon: Trash2,     desc: 'Request cancelled',                 step: 0 },
}

// More granular labels for the raw driver stage shown inside the expanded card
const DRIVER_STAGE_LABEL: Record<string, { label: string; color: string; Icon: any }> = {
  pending:    { label: 'Awaiting assignment',    color: '#b45309', Icon: Clock },
  assigned:   { label: 'Driver assigned',        color: '#0369a1', Icon: Briefcase },
  en_route:   { label: 'Driver en route',        color: '#7c3aed', Icon: Navigation },
  collecting: { label: 'Driver collecting now',  color: '#047857', Icon: Truck },
  collected:  { label: 'Collection complete',    color: '#047857', Icon: Package },
  verified:   { label: 'Verified by system',     color: '#7c3aed', Icon: BadgeCheck },
  cancelled:  { label: 'Cancelled',              color: '#991b1b', Icon: Trash2 },
}

const URGENCY_COLOR: Record<string, string> = {
  low: '#16a34a', normal: '#d97706', high: '#dc2626',
}

const STEPS: { key: UserStatus; label: string }[] = [
  { key: 'pending',     label: 'Submitted' },
  { key: 'in_progress', label: 'Collecting' },
  { key: 'collected',   label: 'Collected' },
  { key: 'verified',    label: 'Verified' },
]

// ─── PDF generator (client-side, no server needed) ────────────────────────────
async function downloadProofPDF(req: WasteRequest) {
  // Dynamically import jsPDF so it's only loaded when needed
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, pageH = 297
  const margin = 20
  let y = margin

  const green = [22, 163, 74] as const
  const darkGreen = [20, 83, 45] as const
  const lightGreen = [240, 253, 244] as const
  const gray = [107, 114, 128] as const
  const darkGray = [31, 41, 55] as const

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(...darkGreen)
  doc.rect(0, 0, W, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('GreenKidsa', margin, y + 7)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(187, 247, 208) // green-200
  doc.text('Waste Collection Proof of Service', margin, y + 14)

  // Status badge (top-right)
  const statusLabel = STATUS_CONFIG[req.status]?.label ?? req.status
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W - margin - 38, y + 2, 38, 10, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...green)
  doc.text(statusLabel.toUpperCase(), W - margin - 19, y + 8.5, { align: 'center' })

  y = 46

  // ── Request ID & dates ───────────────────────────────────────────────────────
  doc.setFillColor(...lightGreen)
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray)
  doc.text('REQUEST ID', margin + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.setFontSize(8)
  doc.text(req._id, margin + 4, y + 12)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray)
  doc.text('SUBMITTED', W / 2, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.setFontSize(8)
  doc.text(new Date(req.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }), W / 2, y + 12)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gray)
  doc.text('LAST UPDATED', W / 2 + 40, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.setFontSize(8)
  doc.text(new Date(req.updatedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }), W / 2 + 40, y + 12)

  y += 28

  // ── Section helper ───────────────────────────────────────────────────────────
  const section = (title: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...green)
    doc.text(title.toUpperCase(), margin, y)
    doc.setDrawColor(...green)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 1.5, W - margin, y + 1.5)
    y += 7
  }

  const row = (label: string, value: string, col2?: { label: string; value: string }) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...gray)
    doc.text(label, margin, y)
    if (col2) doc.text(col2.label, W / 2, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text(value, margin, y + 5)
    if (col2) doc.text(col2.value, W / 2, y + 5)
    y += 12
  }

  // ── Request details ──────────────────────────────────────────────────────────
  section('Collection Details')
  row('WASTE TYPE', req.wasteType.charAt(0).toUpperCase() + req.wasteType.slice(1),
    { label: 'AMOUNT', value: req.amount || 'Not specified' })
  row('URGENCY', req.urgency.toUpperCase(),
    { label: 'PREFERRED DATE', value: req.preferredDate ? new Date(req.preferredDate).toLocaleDateString('en-ZA') : 'Flexible' })
  row('ADDRESS', req.address)
  row('AREA / SUBURB', req.location)
  if (req.description) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...gray)
    doc.text('NOTES / DESCRIPTION', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...darkGray)
    const lines = doc.splitTextToSize(req.description, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 5
  }
  y += 4

  // ── Driver / collection proof ────────────────────────────────────────────────
  section('Collector Information')
  if (req.collectorName) {
    row('ASSIGNED DRIVER', req.collectorName,
      { label: 'COLLECTION STATUS', value: DRIVER_STAGE_LABEL[req.driverStage ?? '']?.label ?? req.driverStage ?? '—' })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...gray)
    doc.text('No collector assigned yet.', margin, y)
    y += 10
  }

  if (req.proof) {
    y += 2
    section('Proof of Collection')
    row('WEIGHT COLLECTED', `${req.proof.weightKg} kg`,
      { label: 'SUBMITTED AT', value: new Date(req.proof.submittedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) })
    if (req.proof.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...gray)
      doc.text("DRIVER'S NOTES", margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...darkGray)
      const lines = doc.splitTextToSize(req.proof.notes, W - margin * 2)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 4
    }
    if (req.proof.imageUrls?.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...gray)
      doc.text('PROOF PHOTOS', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...darkGray)
      req.proof.imageUrls.forEach((url, i) => {
        doc.text(`Photo ${i + 1}: ${url}`, margin, y)
        y += 5
      })
      y += 2
    }
  }

  // ── Verified stamp ───────────────────────────────────────────────────────────
  if (req.status === 'verified') {
    y += 4
    doc.setFillColor(...lightGreen)
    doc.roundedRect(margin, y, W - margin * 2, 18, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...green)
    doc.text('✓  COLLECTION VERIFIED', W / 2, y + 8, { align: 'center' })
    if (req.verifiedAt) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...gray)
      doc.text(`Verified on ${new Date(req.verifiedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`, W / 2, y + 14, { align: 'center' })
    }
    y += 24
  }

  if (req.rewardTokens) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...green)
    doc.text(`⚡  ${req.rewardTokens} green tokens awarded to collector`, margin, y)
    y += 8
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = pageH - 14
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 4, W - margin, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...gray)
  doc.text('GreenKidsa · Waste Management Platform', margin, footerY)
  doc.text(`Generated ${new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`, W - margin, footerY, { align: 'right' })

  doc.save(`greenkidsa-collection-${req._id.slice(-8)}.pdf`)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [requests, setRequests] = useState<WasteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/waste-requests')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch {
      toast.error('Failed to load your requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchRequests()
  }, [user, fetchRequests])

  // Poll every 30 s so status updates from driver come through
  useEffect(() => {
    if (!user) return
    const id = setInterval(fetchRequests, 30_000)
    return () => clearInterval(id)
  }, [user, fetchRequests])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <Leaf className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in required</h2>
          <p className="text-gray-500 text-sm mb-6">Please sign in to view your requests.</p>
          <button onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const filtered = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  const counts = {
    all:         requests.length,
    pending:     requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    collected:   requests.filter(r => r.status === 'collected').length,
    verified:    requests.filter(r => r.status === 'verified').length,
  }

  return (
    <div className="min-h-screen pb-20 mt-20"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #f7fee7 100%)' }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-6 py-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 rounded-xl p-2">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-green-200 text-sm font-medium tracking-wide uppercase">My Activity</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                My Requests
              </h1>
              <p className="text-green-100 text-sm">
                Track the status of all your waste collection requests in real time.
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={fetchRequests}
                className="bg-white/15 hover:bg-white/25 text-white rounded-xl px-3 py-2 text-sm flex items-center gap-1.5 transition">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={() => router.push('/request-collection')}
                className="bg-white text-green-700 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 hover:bg-green-50 transition">
                <Plus className="h-4 w-4" /> New
              </button>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {([['all', 'All'] as const,
               ['pending',     STATUS_CONFIG.pending.label] as const,
               ['in_progress', STATUS_CONFIG.in_progress.label] as const,
               ['collected',   STATUS_CONFIG.collected.label] as const,
               ['verified',    STATUS_CONFIG.verified.label] as const,
            ]).map(([key, label]) => {
              const count = counts[key as keyof typeof counts] ?? 0
              const active = statusFilter === key
              return (
                <button key={key}
                  onClick={() => setStatusFilter(key as any)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition border"
                  style={{
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: 'white',
                    borderColor: active ? 'rgba(255,255,255,0.5)' : 'transparent',
                  }}>
                  {label} · {count}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-4">
              {statusFilter === 'all' ? "You haven't submitted any requests yet." : `No ${statusFilter.replace('_', ' ')} requests.`}
            </p>
            <button onClick={() => router.push('/request-collection')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              <Plus className="h-4 w-4" /> Submit a Request
            </button>
          </div>
        ) : (
          filtered.map(req => (
            <RequestCard
              key={req._id}
              request={req}
              expanded={expandedId === req._id}
              onToggle={() => setExpandedId(prev => prev === req._id ? null : req._id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({ request: r, expanded, onToggle }: {
  request: WasteRequest
  expanded: boolean
  onToggle: () => void
}) {
  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG['pending']
  const currentStep = cfg.step
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [driverLoading, setDriverLoading] = useState(false)
  const [driverError, setDriverError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Fetch driver profile once when card expands and a collectorId exists
  useEffect(() => {
    if (!expanded || !r.collectorId || driver || driverLoading) return
    setDriverLoading(true)
    setDriverError(false)
    fetch(`/api/users/${r.collectorId}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setDriver(data.user))
      .catch(() => setDriverError(true))
      .finally(() => setDriverLoading(false))
  }, [expanded, r.collectorId])

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      await downloadProofPDF(r)
      toast.success('PDF downloaded!')
    } catch (e) {
      console.error(e)
      toast.error('Could not generate PDF. Make sure jspdf is installed.')
    } finally {
      setPdfLoading(false)
    }
  }

  // Determine driver stage details
  const stageMeta = DRIVER_STAGE_LABEL[r.driverStage ?? r.status] ?? null

  const canDownloadPDF = r.status === 'collected' || r.status === 'verified'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Urgency stripe */}
      <div className="h-1" style={{ background: URGENCY_COLOR[r.urgency] }} />

      {/* Summary row */}
      <button onClick={onToggle} className="w-full text-left p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-gray-800 capitalize">{r.wasteType}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{ background: URGENCY_COLOR[r.urgency] + '18', color: URGENCY_COLOR[r.urgency] }}>
                {r.urgency}
              </span>
              {/* Live driver stage pill — only when in progress */}
              {r.status === 'in_progress' && stageMeta && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <stageMeta.Icon className="h-3 w-3" />
                  {stageMeta.label}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />{r.location} · {r.address}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Submitted {new Date(r.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              <cfg.Icon className="h-3 w-3" />{cfg.label}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </div>

        {/* Progress tracker */}
        <div className="mt-4">
          <ProgressTracker currentStep={currentStep} status={r.status} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">

          {/* Status banner — shows the granular driver stage */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: cfg.bg, color: cfg.color }}>
            <div className="flex items-center gap-2">
              <cfg.Icon className="h-4 w-4 flex-shrink-0" />
              {stageMeta ? stageMeta.label : cfg.desc}
            </div>
            {/* PDF download button — shown once collected */}
            {canDownloadPDF && (
              <button
                onClick={e => { e.stopPropagation(); handleDownloadPDF(); }}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: '#14532d', color: 'white' }}>
                {pdfLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <FileDown className="h-3.5 w-3.5" />
                }
                {pdfLoading ? 'Generating…' : 'Download PDF'}
              </button>
            )}
          </div>

          {/* ── Assigned Driver Card ── */}
          {r.collectorId && r.status !== 'pending' && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                <User className="h-3 w-3" /> Assigned Collector
              </p>

              {driverLoading && (
                <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <Loader2 className="h-5 w-5 text-green-400 animate-spin" />
                  <span className="text-xs text-gray-400">Loading collector details…</span>
                </div>
              )}

              {driverError && (
                <div className="px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs text-gray-500">
                  Could not load collector profile.
                  {r.collectorName && <span className="font-semibold text-gray-700"> Name: {r.collectorName}</span>}
                </div>
              )}

              {driver && !driverLoading && (
                <div className="rounded-2xl border border-green-100 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
                  <div className="flex items-center gap-4 px-4 py-4 border-b border-green-50">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ background: driver.isOnline ? '#16a34a' : '#9ca3af' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">{driver.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: '#dcfce7', color: '#15803d' }}>
                          {driver.role}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold"
                          style={{ color: driver.isOnline ? '#16a34a' : '#9ca3af' }}>
                          <CircleDot className="h-2.5 w-2.5" />
                          {driver.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />{driver.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-green-50">
                    <DriverStat icon={<Briefcase className="h-3.5 w-3.5" />} label="Jobs done"     value={driver.totalJobsCompleted.toString()} />
                    <DriverStat icon={<Star className="h-3.5 w-3.5" />}     label="Green tokens"  value={driver.totalPoints.toString()} />
                    <DriverStat icon={<Weight className="h-3.5 w-3.5" />}   label="kg collected"  value={driver.totalKgCollected > 0 ? `${driver.totalKgCollected}` : '—'} />
                  </div>
                  {driver.lastActiveAt && !driver.isOnline && (
                    <div className="px-4 py-2 border-t border-green-50">
                      <p className="text-[10px] text-gray-400">
                        Last seen {new Date(driver.lastActiveAt).toLocaleString('en-ZA', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Proof of collection details — shown when driver has submitted proof */}
          {r.proof && (
            <div className="rounded-xl border border-green-100 bg-green-50/50 px-4 py-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                <Package className="h-3 w-3" /> Collection Proof
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Weight</p>
                  <p className="font-bold text-gray-800">{r.proof.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Submitted</p>
                  <p className="font-bold text-gray-800">
                    {new Date(r.proof.submittedAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {r.proof.notes && (
                <p className="text-xs text-gray-600 italic">"{r.proof.notes}"</p>
              )}
              {r.proof.imageUrls?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1.5">Proof photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {r.proof.imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`Proof ${i + 1}`} className="h-16 w-16 object-cover rounded-xl border border-green-200 hover:opacity-90 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <DetailItem icon={<Weight className="h-3.5 w-3.5" />}   label="Amount"       value={r.amount || 'Not specified'} />
            {r.preferredDate && (
              <DetailItem icon={<Calendar className="h-3.5 w-3.5" />} label="Preferred date"
                value={`${new Date(r.preferredDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}${r.preferredTime ? ' · ' + r.preferredTime : ''}`} />
            )}
            <DetailItem icon={<MapPin className="h-3.5 w-3.5" />}   label="Full address" value={r.address} />
            <DetailItem icon={<Clock className="h-3.5 w-3.5" />}    label="Last updated"
              value={new Date(r.updatedAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          </div>

          {r.description && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px] mb-1">Notes</p>
              {r.description}
            </div>
          )}

          {r.imageUrls?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
                <Camera className="h-3 w-3" /> Your photos
              </p>
              <div className="flex gap-2 flex-wrap">
                {r.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded-xl border border-gray-100" />
                ))}
              </div>
            </div>
          )}

          {r.status === 'verified' && r.rewardTokens && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-green-700"
              style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <Zap className="h-4 w-4" />
              {r.rewardTokens} green tokens awarded to your collector
            </div>
          )}

          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Request ID</p>
            <p className="text-xs font-mono text-gray-600 break-all">{r._id}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DriverStat ───────────────────────────────────────────────────────────────
function DriverStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center py-3 gap-0.5">
      <div className="flex items-center gap-1 text-green-600 mb-1">{icon}</div>
      <span className="text-sm font-bold text-gray-800">{value}</span>
      <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── ProgressTracker ──────────────────────────────────────────────────────────
function ProgressTracker({ currentStep, status }: { currentStep: number; status: UserStatus }) {
  // Don't show the normal tracker for cancelled
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 font-semibold">
        <Trash2 className="h-3.5 w-3.5" /> This request was cancelled
      </div>
    )
  }

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step.key]
        const done     = currentStep > idx + 1
        const active   = currentStep === idx + 1
        const upcoming = currentStep < idx + 1
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? '#16a34a' : active ? cfg.color : '#e5e7eb',
                  color: done || active ? 'white' : '#9ca3af',
                  // Pulse the active step
                  boxShadow: active ? `0 0 0 3px ${cfg.color}22` : 'none',
                }}>
                {done
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <cfg.Icon className="h-3 w-3" />
                }
              </div>
              <span className="text-[9px] font-semibold whitespace-nowrap"
                style={{ color: upcoming ? '#9ca3af' : active ? cfg.color : '#16a34a' }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all"
                style={{ background: done ? '#16a34a' : '#e5e7eb' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── DetailItem ───────────────────────────────────────────────────────────────
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
        {icon}<span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
    </div>
  )
}