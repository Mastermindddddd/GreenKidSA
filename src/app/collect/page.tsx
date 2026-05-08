'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Trash2, MapPin, CheckCircle, Clock, Loader2, Calendar,
  Weight, Search, Camera, Upload, X, AlertTriangle,
  ArrowRight, Package, Leaf, ChevronRight, BadgeCheck,
  Zap, RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'pending' | 'in_progress' | 'collected' | 'verified'

interface WasteRequest {
  _id: string
  userId: string
  userName: string
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
  status: Status
  collectorId: string | null
  collectorName?: string
  createdAt: string
  rewardTokens?: number
}

interface VerificationResult {
  wasteTypeMatch: boolean
  quantityMatch: boolean
  confidence: number
}

const ITEMS_PER_PAGE = 6

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  pending:     { label: 'Pending',     color: '#b45309', bg: '#fef3c7', border: '#fde68a', Icon: Clock },
  in_progress: { label: 'In Progress', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', Icon: Trash2 },
  collected:   { label: 'Collected',   color: '#047857', bg: '#d1fae5', border: '#a7f3d0', Icon: Package },
  verified:    { label: 'Verified',    color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', Icon: BadgeCheck },
}

const URGENCY_COLOR: Record<string, string> = {
  low: '#16a34a', normal: '#d97706', high: '#dc2626',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CollectPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [tasks, setTasks] = useState<WasteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<WasteRequest | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [earnedReward, setEarnedReward] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch all pending/available tasks ─────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/waste-requests/all')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.requests ?? [])
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchTasks()
  }, [user, fetchTasks])

  // ── Status transition ──────────────────────────────────────────────────────
  const updateStatus = async (taskId: string, newStatus: Status, extra: Record<string, unknown> = {}) => {
    setActionLoading(taskId)
    try {
      const res = await fetch(`/api/waste-requests/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Update failed')
      }
      const { request } = await res.json()
      setTasks(prev => prev.map(t => t._id === taskId ? request : t))
      if (selectedTask?._id === taskId) setSelectedTask(request)
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Gemini verification ────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) return
    setVerificationStatus('verifying')

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini API key not configured')

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const base64Data = verificationImage.split(',')[1]

      const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
1. Confirm if the waste type matches: ${selectedTask.wasteType}
2. Estimate if the quantity matches: ${selectedTask.amount}
3. Your confidence level as a number between 0 and 1

Respond ONLY with valid JSON, no markdown:
{"wasteTypeMatch": true/false, "quantityMatch": true/false, "confidence": 0.0}`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
      ])

      const text = result.response.text().trim()
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: VerificationResult = JSON.parse(clean)

      setVerificationResult(parsed)
      setVerificationStatus('success')

      if (parsed.wasteTypeMatch && parsed.quantityMatch && parsed.confidence > 0.7) {
        const tokens = Math.floor(Math.random() * 50) + 10
        setEarnedReward(tokens)
        await updateStatus(selectedTask._id, 'verified', {
          verificationImageUrl: null,
          verificationResult: parsed,
          rewardTokens: tokens,
        })
        toast.success(`✅ Verified! You earned ${tokens} green tokens!`, { duration: 5000 })
      } else {
        toast.error('Verification failed — waste does not match the report.', { duration: 5000 })
      }
    } catch (err: any) {
      console.error('Gemini verification error:', err)
      setVerificationStatus('failure')
      toast.error('Verification error. Please try again.')
    }
  }

  // ── Filtering & pagination ─────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const matchSearch =
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // ── Guards ─────────────────────────────────────────────────────────────────
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
          <p className="text-gray-500 text-sm mb-6">Please sign in to view and collect waste tasks.</p>
          <button onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 mt-20"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #f7fee7 100%)' }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-green-200 text-sm font-medium tracking-wide uppercase">Collector Board</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Waste Collection Tasks
              </h1>
              <p className="text-green-100 text-sm md:text-base max-w-xl">
                Pick up a task, collect the waste, upload a photo for AI verification, and earn green tokens.
              </p>
            </div>
            <button onClick={fetchTasks}
              className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 transition mt-1">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex gap-4 mt-6 flex-wrap">
            {(['pending', 'in_progress', 'collected', 'verified'] as Status[]).map(s => {
              const count = tasks.filter(t => t.status === s).length
              const cfg = STATUS_CONFIG[s]
              return (
                <button key={s}
                  onClick={() => { setStatusFilter(prev => prev === s ? 'all' : s); setCurrentPage(1) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                  style={{
                    background: statusFilter === s ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: statusFilter === s ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                  }}>
                  <cfg.Icon className="h-3 w-3" />
                  {cfg.label} · {count}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-6 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by location, waste type…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Leaf className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tasks match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                currentUserId={user.id}
                actionLoading={actionLoading}
                onStartCollect={() => updateStatus(task._id, 'in_progress')}
                onMarkCollected={() => updateStatus(task._id, 'collected')}
                onVerify={() => {
                  setSelectedTask(task)
                  setVerificationImage(null)
                  setVerificationStatus('idle')
                  setVerificationResult(null)
                  setEarnedReward(null)
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {currentPage} of {pageCount}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))} disabled={currentPage === pageCount}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Verification modal ─────────────────────────────────────────────── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Verify Collection</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedTask.wasteType} · {selectedTask.amount}</p>
              </div>
              <button onClick={() => setSelectedTask(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600">
                Upload a clear photo of the collected waste. Our AI will verify it matches the original report and issue your reward tokens.
              </p>

              {/* Upload zone */}
              {!verificationImage ? (
                <label className="block border-2 border-dashed border-green-200 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition">
                  <Camera className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Tap to upload photo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => setVerificationImage(reader.result as string)
                      reader.readAsDataURL(file)
                    }} />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={verificationImage} alt="Verification" className="w-full rounded-2xl object-cover max-h-56" />
                  <button onClick={() => { setVerificationImage(null); setVerificationStatus('idle'); setVerificationResult(null) }}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}

              {/* Verification result */}
              {verificationStatus === 'success' && verificationResult && (
                <div className="rounded-2xl p-4 space-y-2"
                  style={{ background: verificationResult.confidence > 0.7 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${verificationResult.confidence > 0.7 ? '#bbf7d0' : '#fecaca'}` }}>
                  <div className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: verificationResult.confidence > 0.7 ? '#15803d' : '#dc2626' }}>
                    {verificationResult.confidence > 0.7
                      ? <><BadgeCheck className="h-4 w-4" /> Verification passed</>
                      : <><AlertTriangle className="h-4 w-4" /> Verification failed</>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-2">
                    <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                      <div className="font-bold text-base" style={{ color: verificationResult.wasteTypeMatch ? '#16a34a' : '#dc2626' }}>
                        {verificationResult.wasteTypeMatch ? '✓' : '✗'}
                      </div>
                      <div className="text-gray-500">Type match</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                      <div className="font-bold text-base" style={{ color: verificationResult.quantityMatch ? '#16a34a' : '#dc2626' }}>
                        {verificationResult.quantityMatch ? '✓' : '✗'}
                      </div>
                      <div className="text-gray-500">Qty match</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-xl border border-gray-100">
                      <div className="font-bold text-base text-gray-800">
                        {Math.round(verificationResult.confidence * 100)}%
                      </div>
                      <div className="text-gray-500">Confidence</div>
                    </div>
                  </div>
                  {earnedReward && (
                    <div className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl text-sm font-bold text-green-700"
                      style={{ background: '#dcfce7' }}>
                      <Zap className="h-4 w-4" />
                      +{earnedReward} green tokens earned!
                    </div>
                  )}
                </div>
              )}

              {verificationStatus === 'failure' && (
                <div className="rounded-2xl p-4 text-sm text-red-700 flex items-center gap-2"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" /> AI verification failed. Please try again.
                </div>
              )}

              {/* Action buttons */}
              <button
                onClick={handleVerify}
                disabled={!verificationImage || verificationStatus === 'verifying' || verificationStatus === 'success'}
                className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: (!verificationImage || verificationStatus !== 'idle') ? '#86efac' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: verificationImage && verificationStatus === 'idle' ? '0 6px 20px rgba(22,163,74,0.35)' : 'none',
                }}>
                {verificationStatus === 'verifying'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying with AI…</>
                  : verificationStatus === 'success'
                  ? <><BadgeCheck className="h-4 w-4" /> Verification Complete</>
                  : <><Camera className="h-4 w-4" /> Verify with Gemini AI</>}
              </button>

              <button onClick={() => setSelectedTask(null)}
                className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({
  task, currentUserId, actionLoading, onStartCollect, onMarkCollected, onVerify,
}: {
  task: WasteRequest
  currentUserId: string
  actionLoading: string | null
  onStartCollect: () => void
  onMarkCollected: () => void
  onVerify: () => void
}) {
  const cfg = STATUS_CONFIG[task.status]
  const isLoading = actionLoading === task._id
  const isMyTask = task.collectorId === currentUserId

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top urgency bar */}
      <div className="h-1 w-full" style={{ background: URGENCY_COLOR[task.urgency] }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-800 truncate">{task.location}</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style={{ background: URGENCY_COLOR[task.urgency] + '18', color: URGENCY_COLOR[task.urgency] }}>
                {task.urgency}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{task.address}</p>
          </div>
          {/* Status badge */}
          <span className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            <cfg.Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5 text-gray-400" />{task.wasteType}
          </span>
          <span className="flex items-center gap-1.5">
            <Weight className="h-3.5 w-3.5 text-gray-400" />{task.amount || 'Unknown'}
          </span>
          {task.preferredDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {new Date(task.preferredDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              {task.preferredTime && ` · ${task.preferredTime}`}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-4 line-clamp-2">{task.description}</p>
        )}

        {/* Reporter photos */}
        {task.imageUrls?.length > 0 && (
          <div className="flex gap-2 mb-4">
            {task.imageUrls.slice(0, 4).map((url, i) => (
              <img key={i} src={url} alt="" className="h-14 w-14 object-cover rounded-xl border border-gray-100" />
            ))}
            {task.imageUrls.length > 4 && (
              <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-semibold border border-gray-100">
                +{task.imageUrls.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Collector info */}
        {task.collectorName && task.status !== 'pending' && (
          <p className="text-xs text-gray-400 mb-3">
            Collector: <span className="font-semibold text-gray-600">{task.collectorName}</span>
          </p>
        )}

        {/* Action */}
        <div className="flex justify-end">
          {task.status === 'pending' && (
            <ActionBtn onClick={onStartCollect} loading={isLoading} color="#16a34a">
              Start Collection <ArrowRight className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
          {task.status === 'in_progress' && isMyTask && (
            <ActionBtn onClick={onMarkCollected} loading={isLoading} color="#1d4ed8">
              Mark Collected <CheckCircle className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
          {task.status === 'collected' && isMyTask && (
            <ActionBtn onClick={onVerify} loading={false} color="#7c3aed">
              Verify & Earn <Zap className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
          {task.status === 'in_progress' && !isMyTask && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
              Claimed by another collector
            </span>
          )}
          {task.status === 'verified' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified {task.rewardTokens ? `· ${task.rewardTokens} tokens` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ onClick, loading, color, children }: {
  onClick: () => void
  loading: boolean
  color: string
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-60"
      style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  )
}