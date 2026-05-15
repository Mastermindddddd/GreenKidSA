'use client'

import { useState, useEffect } from 'react'
import {
  User, Mail, Phone, MapPin, Save, Shield, Truck,
  Package, Star, CheckCircle, Clock, Leaf, Bell,
  BellOff, Camera, ChevronRight, Activity, AlertCircle,
  Loader2, Lock, Eye, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'driver' | 'admin'

type UserProfile = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  address?: string
  notifications?: boolean
  totalPoints: number
  totalJobsCompleted: number
  totalKgCollected: number
  lastActiveAt: string | null
  createdAt: string | null
  isOnline?: boolean
}

type FormState = {
  name: string
  email: string
  phone: string
  address: string
  notifications: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${color} text-white`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <Icon size={22} className="mb-3 opacity-90" />
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm opacity-80 mt-0.5">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">{title}</h2>
      {children}
    </div>
  )
}

function InputField({
  id, label, icon: Icon, type = 'text', value, onChange, disabled, placeholder,
  rightSlot
}: {
  id: string; label: string; icon: React.ElementType; type?: string
  value: string; onChange: (v: string) => void; disabled?: boolean
  placeholder?: string; rightSlot?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
            focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  )
}

function PasswordField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <InputField
      id={id}
      label={label}
      icon={Lock}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder="••••••••"
      rightSlot={
        <button type="button" onClick={() => setShow(s => !s)} className="text-gray-400 hover:text-gray-600 transition">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5
      rounded-2xl text-sm font-medium shadow-xl border animate-in fade-in slide-in-from-bottom-4
      ${type === 'success'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-red-50 text-red-800 border-red-200'
      }`}>
      {type === 'success'
        ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
        : <AlertCircle size={16} className="text-red-500 shrink-0" />}
      {message}
    </div>
  )
}

// ─── Role badges ──────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  user:   { label: 'Resident',      icon: User,    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'   },
  driver: { label: 'Driver',        icon: Truck,   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  admin:  { label: 'Administrator', icon: Shield,  color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', address: '',
    notifications: true,
    currentPassword: '', newPassword: '', confirmPassword: '',
  })

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // 1. Verify session & get basic info
        const authRes = await fetch('/api/auth')
        const authData = await authRes.json()
        if (!authData.user) {
          window.location.href = '/login'
          return
        }

        // 2. Fetch full profile
        const profileRes = await fetch(`/api/users/${authData.user.id}`)
        const profileData = await profileRes.json()
        if (!profileData.user) throw new Error('Failed to load profile')

        setProfile(profileData.user)
        setForm(f => ({
          ...f,
          name:          profileData.user.name          ?? '',
          email:         profileData.user.email         ?? '',
          phone:         profileData.user.phone         ?? '',
          address:       profileData.user.address       ?? '',
          notifications: profileData.user.notifications ?? true,
        }))
      } catch {
        showToast('Failed to load profile', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Save profile ─────────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name.trim(),
          phone:         form.phone.trim(),
          address:       form.address.trim(),
          notifications: form.notifications,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setProfile(p => p ? { ...p, ...data.user } : p)
      showToast('Profile updated successfully', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!profile) return
    if (form.newPassword !== form.confirmPassword) {
      showToast('New passwords do not match', 'error'); return
    }
    if (form.newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error'); return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${profile.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword:     form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      setField('currentPassword', '')
      setField('newPassword', '')
      setField('confirmPassword', '')
      showToast('Password changed successfully', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading your profile…</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const roleMeta = ROLE_META[profile.role]
  const RoleIcon = roleMeta.icon

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header / Hero */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 pt-24 pb-28 px-6 overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-emerald-900/20 blur-3xl" />

        <div className="max-w-2xl mx-auto relative">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center
                text-white text-2xl font-bold border-2 border-white/30 shadow-xl">
                {getInitials(profile.name)}
              </div>
              <button
                type="button"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-white
                  flex items-center justify-center shadow-md hover:shadow-lg transition"
                title="Change photo (coming soon)"
              >
                <Camera size={13} className="text-emerald-600" />
              </button>
            </div>

            {/* Name + role */}
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-semibold
                border ${roleMeta.bg} ${roleMeta.color}`}>
                <RoleIcon size={12} />
                {roleMeta.label}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-emerald-100 opacity-80">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats row — role-specific */}
      <div className="max-w-2xl mx-auto px-6 -mt-14 relative z-10">
        {profile.role === 'user' && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Star}    label="Points"     value={profile.totalPoints}        color="from-amber-400 to-orange-500" />
            <StatCard icon={Package} label="Requests"   value={profile.totalJobsCompleted} color="from-blue-400 to-indigo-500"  />
            <StatCard icon={Leaf}    label="kg Saved"   value={`${profile.totalKgCollected}kg`} color="from-emerald-400 to-teal-500" />
          </div>
        )}
        {profile.role === 'driver' && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Truck}         label="Jobs Done"  value={profile.totalJobsCompleted} color="from-amber-400 to-orange-500" />
            <StatCard icon={Leaf}          label="kg Collected" value={`${profile.totalKgCollected}kg`} color="from-emerald-400 to-teal-500" />
            <StatCard icon={Activity}      label="Status"     value={profile.isOnline ? 'Online' : 'Offline'} color={profile.isOnline ? "from-emerald-500 to-green-600" : "from-gray-400 to-gray-500"} />
          </div>
        )}
        {profile.role === 'admin' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Shield}  label="Role"       value="Administrator" color="from-purple-500 to-violet-600" />
            <StatCard icon={Clock}   label="Last Active" value={formatDate(profile.lastActiveAt)} color="from-slate-500 to-slate-600" />
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['profile', 'security'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition capitalize
                ${activeTab === tab
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 mt-6 pb-24 space-y-8">

        {activeTab === 'profile' && (
          <>
            {/* ── Personal info ── */}
            <Section title="Personal Information">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                <InputField
                  id="name" label="Full Name" icon={User}
                  value={form.name} onChange={v => setField('name', v)}
                />
                <InputField
                  id="email" label="Email Address" icon={Mail}
                  value={form.email} onChange={v => setField('email', v)}
                  disabled
                  // Email changes require re-verification — disabled for now.
                />
                <InputField
                  id="phone" label="Phone Number" icon={Phone}
                  value={form.phone} onChange={v => setField('phone', v)}
                  placeholder="+27 xx xxx xxxx"
                />
                {/* Address only shown for users/drivers */}
                {profile.role !== 'admin' && (
                  <InputField
                    id="address" label="Address" icon={MapPin}
                    value={form.address} onChange={v => setField('address', v)}
                    placeholder="123 Eco Street, Pretoria"
                  />
                )}
              </div>
            </Section>

            {/* ── Notifications ── */}
            <Section title="Preferences">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <button
                  type="button"
                  onClick={() => setField('notifications', !form.notifications)}
                  className="w-full flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                      ${form.notifications ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {form.notifications ? <Bell size={18} /> : <BellOff size={18} />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {form.notifications ? 'You will receive email updates' : 'Notifications are muted'}
                      </p>
                    </div>
                  </div>
                  {/* Toggle pill */}
                  <div className={`w-11 h-6 rounded-full transition-colors shrink-0
                    ${form.notifications ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-all
                      ${form.notifications ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5 ml-0'}`} />
                  </div>
                </button>
              </div>
            </Section>

            {/* ── Driver-only: vehicle info prompt ── */}
            {profile.role === 'driver' && (
              <Section title="Driver Info">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                  <Truck size={20} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Vehicle & Route Details</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Vehicle registration, capacity, and service area are managed by your administrator.
                      Contact admin to update these details.
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* ── Admin-only: admin notice ── */}
            {profile.role === 'admin' && (
              <Section title="Admin Access">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-start gap-4">
                  <Shield size={20} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Administrator Account</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Your account has elevated privileges. Changes to admin roles must be made
                      directly in the database by a super-admin.
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-purple-300 mt-0.5 ml-auto shrink-0" />
                </div>
              </Section>
            )}

            {/* ── Save button ── */}
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-medium
                transition shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin mr-2 inline" />Saving…</>
                : <><Save size={16} className="mr-2 inline" />Save Changes</>
              }
            </Button>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <Section title="Change Password">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                <PasswordField
                  id="currentPassword" label="Current Password"
                  value={form.currentPassword} onChange={v => setField('currentPassword', v)}
                />
                <PasswordField
                  id="newPassword" label="New Password"
                  value={form.newPassword} onChange={v => setField('newPassword', v)}
                />
                <PasswordField
                  id="confirmPassword" label="Confirm New Password"
                  value={form.confirmPassword} onChange={v => setField('confirmPassword', v)}
                />
                <p className="text-xs text-gray-400">Minimum 8 characters. Use a mix of letters, numbers, and symbols.</p>
              </div>
            </Section>

            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-medium
                transition shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin mr-2 inline" />Updating…</>
                : <><Lock size={16} className="mr-2 inline" />Update Password</>
              }
            </Button>

            {/* Account danger zone */}
            <Section title="Account">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sign out of all devices</p>
                    <p className="text-xs text-gray-400 mt-0.5">Revokes all active sessions</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl"
                    onClick={async () => {
                      await fetch('/api/auth', { method: 'DELETE' })
                      window.location.href = '/login'
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}