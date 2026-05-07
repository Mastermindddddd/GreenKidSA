// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, Wind } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'        
import AuthModal from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export default function Home() {
  const { user } = useAuth()                                       
  const [authModalOpen, setAuthModalOpen] = useState(false)  
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0,
  })

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100)
        const rewards = await getAllRewards()
        const tasks = await getWasteCollectionTasks(100)

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/)
          const amount = match ? parseFloat(match[0]) : 0
          return total + amount
        }, 0)

        const reportsSubmitted = reports.length
        const tokensEarned = rewards.reduce((t, r) => t + (r.points || 0), 0)
        const co2Offset = wasteCollected * 0.5

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10,
        })
      } catch {
        setImpactData({ wasteCollected: 0, reportsSubmitted: 0, tokensEarned: 0, co2Offset: 0 })
      }
    }
    fetchImpactData()
  }, [])

  return (
    <div className={`${poppins.className} bg-[#f0f4f1]`}>
      <style>{`
        @keyframes blurIn {
          from { opacity: 0; filter: blur(12px); transform: translateY(10px); }
          to   { opacity: 1; filter: blur(0);   transform: translateY(0); }
        }
        @keyframes scrollLine {
          0%   { transform: scaleY(0); transform-origin: top; }
          50%  { transform: scaleY(1); transform-origin: top; }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
        .blur-in { animation: blurIn 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .scroll-line { animation: scrollLine 2s ease-in-out infinite; }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#d8e8dc]">

        {/* Background image */}
        <img
          src="/hero.png"
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay – dark-green tint so text always reads */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b2f26]/70 via-[#0f3d2e]/50 to-[#1a5c43]/40" />

        {/* Bottom fade into page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#f0f4f1] via-[#f0f4f1]/40 to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full pt-24 pb-40">
          <div className="max-w-7xl mx-auto px-6 lg:pl-6 lg:pr-12">
            <div className="max-w-2xl">

              {/* Eyebrow */}
              <span
                className="blur-in inline-block text-xs uppercase tracking-[0.3em] text-green-300 mb-6 font-medium"
                style={{ animationDelay: '0.15s' }}
              >
                Environmental Operations · South Africa
              </span>

              {/* Headline */}
              <h1 className="font-semibold leading-[1.05] text-white mb-6">
                <span
                  className="blur-in block text-5xl md:text-7xl lg:text-8xl"
                  style={{ animationDelay: '0.3s' }}
                >
                  Green
                </span>
                <span
                  className="blur-in block text-5xl md:text-7xl lg:text-8xl text-green-500"
                  style={{ animationDelay: '0.45s' }}
                >
                  KidSA.
                </span>
              </h1>

              {/* Sub */}
              <p
                className="blur-in text-base md:text-lg text-green-200/80 leading-relaxed mb-10 max-w-md font-light"
                style={{ animationDelay: '0.65s' }}
              >
                Track collections, empower workers, and protect communities through smart environmental operations.
              </p>

              {/* CTA */}
              <div
                className="blur-in flex flex-col sm:flex-row gap-4"
                style={{ animationDelay: '0.85s' }}
              >
                {!user ? (                                            // ← was !loggedIn
                <button
                  onClick={() => setAuthModalOpen(true)}           // ← opens modal instead of setLoggedIn
                  className="group inline-flex items-center justify-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm tracking-wide font-semibold transition-all duration-300 hover:bg-green-50 shadow-2xl shadow-black/20"
                >
                  Enter Platform
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              ) : (
                <Link href="/report">
                  <button className="group inline-flex items-center justify-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm tracking-wide font-semibold transition-all duration-300 hover:bg-green-50 shadow-2xl shadow-black/20">
                    Report Waste
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </Link>
              )}


                <Link href="/leaderboard">
                  <button className="inline-flex items-center justify-center gap-2 border border-white/30 text-white/90 px-8 py-4 rounded-full text-sm tracking-wide font-medium backdrop-blur-sm bg-white/10 transition-all duration-300 hover:bg-white/20">
                    View Impact
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 z-10">
          <span className="text-[10px] tracking-[0.25em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-white/20 overflow-hidden relative">
            <div className="scroll-line absolute inset-0 bg-white/70" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto py-20 px-6 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        <FeatureCard icon={Leaf} title="Eco Intelligence" description="Data-driven waste reporting that improves environmental decision-making." />
        <FeatureCard icon={Wind} title="Field Monitoring" description="Track drivers and collections in real time to reduce inefficiencies." />
        <FeatureCard icon={Users} title="Community Network" description="Connect citizens, workers, and admins into one accountable system." />
      </section>

      {/* ── IMPACT ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-green-100 shadow-sm p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-green-600 text-center mb-3 font-medium">
            Live Data
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-green-900 mb-10 text-center">
            Environmental Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <ImpactCard title="Waste" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
            <ImpactCard title="Reports" value={impactData.reportsSubmitted} icon={MapPin} />
            <ImpactCard title="Rewards" value={impactData.tokensEarned} icon={Coins} />
            <ImpactCard title="CO₂ Saved" value={`${impactData.co2Offset} kg`} icon={Leaf} />
          </div>
        </div>
      </section>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="login"
      />
    </div>
  )
}

/* ── Sub-components ── */

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group bg-white/70 backdrop-blur-sm p-7 rounded-2xl border border-green-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-green-100 mb-5 group-hover:bg-green-200 transition-colors duration-300">
        <Icon className="h-5 w-5 text-green-800" />
      </div>
      <h3 className="text-base font-semibold text-green-900 mb-2">{title}</h3>
      <p className="text-green-700 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#f4faf6] to-[#e6f2eb] border border-green-100 hover:scale-[1.03] transition-transform duration-300">
      <Icon className="h-7 w-7 text-green-700 mb-4" />
      <p className="text-2xl md:text-3xl font-semibold text-green-900 mb-1">{value}</p>
      <p className="text-xs uppercase tracking-widest text-green-600 font-medium">{title}</p>
    </div>
  )
}