// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

const poppins = Poppins({ 
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

function FloatingLeaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <Leaf
          key={i}
          className="absolute text-green-300 opacity-20 animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `scale(${0.5 + Math.random()})`
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100);
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((t, r) => t + (r.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10
        });
      } catch {
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        });
      }
    }

    fetchImpactData();
  }, []);

  return (
    <div className={`${poppins.className} bg-[#eef5f1] min-h-screen relative`}>

      {/* 🌲 HERO (EXPANDED) */}
      <section className="relative bg-gradient-to-br from-[#0b2f26] via-[#0f3d2e] to-[#145c43] text-white pt-32 pb-40 px-6 text-center overflow-hidden">
        <FloatingLeaves />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 tracking-tight leading-tight">
            GreenKidSA
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-green-100 leading-relaxed mb-10">
            Let us take care of your waste — track collections, empower workers, and protect communities through smart environmental operations.
          </p>

          {!loggedIn ? (
            <Button 
              onClick={() => setLoggedIn(true)}
              className="bg-white text-green-900 hover:bg-green-100 px-8 py-5 rounded-full text-lg shadow-lg"
            >
              Enter Platform <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Link href="/report">
              <Button className="bg-white text-green-900 hover:bg-green-100 px-8 py-5 rounded-full text-lg shadow-lg">
                Report Waste <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* 📊 HERO STATS (NEW) */}
        {/*<div className="relative z-10 mt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={Recycle} value={`${impactData.wasteCollected}kg`} label="Collected" />
          <StatCard icon={MapPin} value={impactData.reportsSubmitted} label="Reports" />
          <StatCard icon={Coins} value={impactData.tokensEarned} label="Rewards" />
          <StatCard icon={Leaf} value={`${impactData.co2Offset}kg`} label="CO₂ Saved" />
        </div>*/}

        {/* 🌄 WAVE */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 320" className="w-full h-28 md:h-36">
            <path fill="#eef5f1" d="M0,192L60,181.3C120,171,240,149,360,149.3C480,149,600,171,720,192C840,213,960,235,1080,224C1200,213,1320,171,1380,149.3L1440,128V320H0Z"></path>
          </svg>
        </div>
      </section>

      {/* 🌿 FEATURES */}
      <section className="max-w-6xl mx-auto py-16 md:py-20 px-6 grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
        <FeatureCard icon={Leaf} title="Eco Intelligence" description="Data-driven waste reporting that improves environmental decision-making." />
        <FeatureCard icon={Wind} title="Field Monitoring" description="Track drivers and collections in real time to reduce inefficiencies." />
        <FeatureCard icon={Users} title="Community Network" description="Connect citizens, workers, and admins into one accountable system." />
      </section>

      {/* 📊 IMPACT */}
      <section className="max-w-6xl mx-auto px-6 pb-20 md:pb-24">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-green-100 p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-green-900 mb-8 md:mb-10 text-center">
            Live Environmental Impact
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <ImpactCard title="Waste" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
            <ImpactCard title="Reports" value={impactData.reportsSubmitted} icon={MapPin} />
            <ImpactCard title="Rewards" value={impactData.tokensEarned} icon={Coins} />
            <ImpactCard title="CO₂ Saved" value={`${impactData.co2Offset} kg`} icon={Leaf} />
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 md:p-5 text-center">
      <Icon className="mx-auto mb-2 h-5 w-5 md:h-6 md:w-6 text-green-200" />
      <p className="text-lg md:text-xl font-semibold">{value}</p>
      <p className="text-xs md:text-sm text-green-100">{label}</p>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }) {
  return (
    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#f6faf7] to-[#e8f3ec] border border-green-100 hover:scale-105 transition-transform">
      <Icon className="h-7 w-7 md:h-8 md:w-8 text-green-700 mb-3" />
      <p className="text-lg md:text-2xl font-semibold text-green-900">{value}</p>
      <p className="text-xs md:text-sm text-green-700">{title}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all text-center">
      <div className="bg-gradient-to-br from-green-200 to-green-100 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full mx-auto mb-4 md:mb-5 shadow-inner">
        <Icon className="text-green-800" />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-green-900 mb-2 md:mb-3">{title}</h3>
      <p className="text-green-700 text-xs md:text-sm leading-relaxed">{description}</p>
    </div>
  )
}
