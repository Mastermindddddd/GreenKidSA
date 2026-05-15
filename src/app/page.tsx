// @ts-nocheck
'use client'
import { useState } from 'react'
import {
  ArrowRight, Leaf, Users, Wind,
  Truck, ClipboardList, Award, ChevronRight, CheckCircle2,
  Mail, Globe, Building2, Shield, BarChart3, Bell,
  TreePine, Droplets, Sun, ExternalLink, Star, Recycle
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'
import { Poppins } from 'next/font/google'
import Link from 'next/link'

const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export default function Home() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .blur-in  { animation: blurIn 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .scroll-line { animation: scrollLine 2s ease-in-out infinite; }
        .fade-up  { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .pulse-ring::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: currentColor;
          animation: pulse-ring 1.8s ease-out infinite;
        }
        .section-divider {
          background: linear-gradient(90deg, transparent, #86efac, transparent);
          height: 1px;
          width: 100%;
        }
      `}</style>

      {/* ── HERO (unchanged) ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#d8e8dc]">
        <img src="/hero.png" alt="Hero background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b2f26]/70 via-[#0f3d2e]/50 to-[#1a5c43]/40" />
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#f0f4f1] via-[#f0f4f1]/40 to-transparent" />

        <div className="relative z-10 w-full pt-24 pb-40">
          <div className="max-w-7xl mx-auto px-6 lg:pl-6 lg:pr-12">
            <div className="max-w-2xl">
              <span className="blur-in inline-block text-xs uppercase tracking-[0.3em] text-green-300 mb-6 font-medium" style={{ animationDelay: '0.15s' }}>
                Environmental Operations · South Africa
              </span>
              <h1 className="font-semibold leading-[1.05] text-white mb-6">
                <span className="blur-in block text-5xl md:text-7xl lg:text-8xl" style={{ animationDelay: '0.3s' }}>Green</span>
                <span className="blur-in block text-5xl md:text-7xl lg:text-8xl text-green-500" style={{ animationDelay: '0.45s' }}>KidSA.</span>
              </h1>
              <p className="blur-in text-base md:text-lg text-green-200/80 leading-relaxed mb-10 max-w-md font-light" style={{ animationDelay: '0.65s' }}>
                Track collections, empower workers, and protect communities through smart environmental operations.
              </p>
              <div className="blur-in flex flex-col sm:flex-row gap-4" style={{ animationDelay: '0.85s' }}>
                {!user ? (
                  <button onClick={() => setAuthModalOpen(true)} className="group inline-flex items-center justify-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm tracking-wide font-semibold transition-all duration-300 hover:bg-green-50 shadow-2xl shadow-black/20">
                    Enter Platform
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                ) : (
                  <Link href="/request-collection">
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

      <div className="section-divider max-w-6xl mx-auto px-6" />

      {/* ── OVERVIEW / ABOUT ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900 leading-tight mb-6">
              South Africa's Environmental Operations Platform
            </h2>
            <p className="text-green-800/70 leading-relaxed mb-5 font-light">
              GreenKidSA is a registered South African environmental services company headquartered in Bloemfontein. We bridge the gap between communities, waste collection workers, and environmental authorities through intelligent digital infrastructure.
            </p>
            <p className="text-green-800/70 leading-relaxed mb-8 font-light">
              From reporting illegal dumping to rewarding responsible citizens, we make environmental accountability accessible, transparent, and impactful across South Africa.
            </p>
            <div className="flex flex-wrap gap-3">
              {['CIPC Registered', 'VAT Compliant', 'CSD Verified', 'ISO Aligned'].map(badge => (
                <span key={badge} className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Visual panel — no stats */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 p-10 flex flex-col justify-between min-h-[320px]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4ade80 0%, transparent 60%), radial-gradient(circle at 20% 80%, #14b8a6 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <Leaf className="w-10 h-10 text-green-300 mb-6" />
              <p className="text-2xl font-semibold text-white leading-snug mb-4">
                "A cleaner South Africa starts with accountable communities."
              </p>
              <p className="text-green-300/70 text-sm font-light leading-relaxed">
                GreenKidSA gives every citizen, worker, and administrator the tools to take ownership of the environment around them.
              </p>
            </div>
            <div className="relative z-10 mt-8 flex flex-wrap gap-2">
              {['Free State', 'Mangaung Metro', 'Bloemfontein', 'Northern Cape'].map(tag => (
                <span key={tag} className="text-xs bg-white/10 border border-white/20 text-green-200 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto px-6" />

      {/* ── VALUE PROPOSITION ── */}
      <section className="bg-gradient-to-b from-[#f0f4f1] to-[#e6f0e9] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Why GreenKidSA</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900">Built for Every Stakeholder</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                audience: 'For Communities',
                icon: Users,
                color: 'from-green-600 to-emerald-700',
                points: [
                  'Report waste in seconds via mobile',
                  'Earn reward tokens for participation',
                  'Track collection status in real time',
                  'Build cleaner neighbourhoods together',
                ],
              },
              {
                audience: 'For Workers',
                icon: Truck,
                color: 'from-teal-600 to-green-700',
                featured: true,
                points: [
                  'Receive geo-tagged collection tasks',
                  'Log completed jobs digitally',
                  'Access earnings & performance records',
                  'Communicate issues to supervisors',
                ],
              },
              {
                audience: 'For Administrators',
                icon: BarChart3,
                color: 'from-emerald-700 to-teal-800',
                points: [
                  'Dashboard with live operational data',
                  'Manage teams, tasks, and zones',
                  'Generate compliance reports',
                  'Track environmental outcomes',
                ],
              },
            ].map(({ audience, icon: Icon, color, points, featured }) => (
              <div
                key={audience}
                className={`rounded-3xl p-8 flex flex-col gap-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  featured
                    ? 'bg-green-900 border-green-700 shadow-2xl shadow-green-900/20 scale-[1.02]'
                    : 'bg-white border-green-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${featured ? 'text-white' : 'text-green-900'}`}>{audience}</h3>
                  {featured && <span className="text-xs bg-green-700 text-green-200 px-2 py-0.5 rounded-full">Core users</span>}
                </div>
                <ul className="space-y-3">
                  {points.map(pt => (
                    <li key={pt} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${featured ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm leading-relaxed ${featured ? 'text-green-200' : 'text-green-700'}`}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Get Started</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-green-900">What Would You Like to Do?</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Report Waste', desc: 'Flag illegal dumping or missed collections', icon: ClipboardList, href: '/request-collection', color: 'bg-green-600' },
            { label: 'Track Collection', desc: 'Follow your waste collection in real time', icon: Truck, href: '/collect-waste', color: 'bg-teal-600' },
            { label: 'Earn Rewards', desc: 'Redeem tokens for community participation', icon: Award, href: '/rewards', color: 'bg-emerald-600' },
            { label: 'View Leaderboard', desc: 'See top contributors in your area', icon: BarChart3, href: '/leaderboard', color: 'bg-green-800' },
          ].map(({ label, desc, icon: Icon, href, color }) => (
            <Link key={label} href={user ? href : '#'} onClick={!user ? () => setAuthModalOpen(true) : undefined}>
              <div className="group bg-white border border-green-100 rounded-2xl p-6 h-full flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className={`${color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">{label}</h3>
                  <p className="text-sm text-green-700/70 leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <span>Go</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto px-6" />

      {/* ── SERVICE HIGHLIGHTS ── */}
      <section className="py-24 bg-green-900 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-800/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-900/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-400 mb-4 font-medium">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Comprehensive Environmental Solutions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Recycle, title: 'Waste Collection Management',
                desc: 'End-to-end coordination of waste collection schedules, routes, and worker assignments across residential, commercial, and industrial zones.',
              },
              {
                icon: TreePine, title: 'Green Space Monitoring',
                desc: 'Regular assessment and reporting on parks, verges, and community green areas to ensure standards are maintained year-round.',
              },
              {
                icon: Droplets, title: 'Environmental Compliance',
                desc: 'Assist municipalities and businesses in meeting local environmental regulations with thorough documentation and audit trails.',
              },
              {
                icon: Sun, title: 'Community Education Programmes',
                desc: 'Awareness campaigns, school programmes, and community workshops that build lasting environmental responsibility in South African townships and suburbs.',
              },
              {
                icon: Shield, title: 'Illegal Dumping Response',
                desc: 'Rapid response to reported illegal dumping sites with geo-tagged evidence collection, contractor coordination, and municipal liaison.',
              },
              {
                icon: Bell, title: 'Real-Time Alerts & Notifications',
                desc: 'Push notifications keep citizens informed about collection days, service disruptions, and environmental alerts in their neighbourhood.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-5 bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-green-700/50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-green-200/60 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE AREAS ── */}
      {/*<section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Coverage</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-green-900 mb-4">Service Areas Across South Africa</h2>
          <p className="text-green-700/70 max-w-xl mx-auto font-light leading-relaxed">
            Operating from our Bloemfontein headquarters, GreenKidSA serves communities across the Free State, Northern Cape, and expanding nationally.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {[
            { region: 'Bloemfontein', province: 'Free State', status: 'Headquarters', active: true },
            { region: 'Mangaung Metro', province: 'Free State', status: 'Active', active: true },
            { region: 'Motheo District', province: 'Free State', status: 'Active', active: true },
            { region: 'Lejweleputswa', province: 'Free State', status: 'Active', active: true },
            { region: 'Northern Cape', province: 'Northern Cape', status: 'Expanding', active: false },
            { region: 'Gauteng South', province: 'Gauteng', status: 'Coming Soon', active: false },
          ].map(({ region, province, status, active }) => (
            <div key={region} className={`flex items-start gap-4 border rounded-2xl p-5 ${active ? 'bg-white border-green-100' : 'bg-green-50/40 border-green-100/60'}`}>
              <div className={`relative flex-shrink-0 w-3 h-3 rounded-full mt-1 ${active ? 'bg-green-500 pulse-ring' : 'bg-green-300'}`} />
              <div>
                <p className="font-semibold text-green-900">{region}</p>
                <p className="text-sm text-green-700/60">{province}</p>
                <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-green-600">
          Not seeing your area?{' '}
          <a href="mailto:info@greenkidsa.co.za" className="underline underline-offset-2 hover:text-green-800 transition-colors">
            Contact us to enquire about expansion.
          </a>
        </p>
      </section>*/}

      <div className="section-divider max-w-6xl mx-auto px-6" />

      {/* ── LATEST UPDATES ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Updates</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900">Latest from GreenKidSA</h2>
          </div>
          <Link href="/leaderboard" className="hidden sm:inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium transition-colors">
            View all <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              tag: 'Platform Update',
              date: 'May 2025',
              title: 'Real-Time Collection Tracking Now Live',
              desc: 'Citizens can now follow their waste collection truck on a live map from the moment it leaves the depot to their street.',
              color: 'bg-green-100 text-green-700',
            },
            {
              tag: 'Community',
              date: 'April 2025',
              title: 'Rewards Programme Surpasses 10,000 Tokens',
              desc: 'The GreenKidSA token economy has reached a major milestone, with thousands of residents earning and redeeming rewards for environmental action.',
              color: 'bg-teal-100 text-teal-700',
            },
            {
              tag: 'Expansion',
              date: 'March 2025',
              title: 'New Partnership with Mangaung Municipality',
              desc: 'GreenKidSA has formalised a service agreement to digitise waste management operations across the Mangaung Metropolitan Municipality.',
              color: 'bg-emerald-100 text-emerald-700',
            },
          ].map(({ tag, date, title, desc, color }) => (
            <article key={title} className="group bg-white border border-green-100 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{tag}</span>
                <span className="text-xs text-green-500 font-medium">{date}</span>
              </div>
              <h3 className="font-semibold text-green-900 leading-snug">{title}</h3>
              <p className="text-sm text-green-700/70 leading-relaxed flex-1">{desc}</p>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                Read more <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── TRUST / TESTIMONIALS ── */}
      {/*<section className="bg-gradient-to-b from-[#e6f0e9] to-[#f0f4f1] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Trusted By Communities</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900">What People Are Saying</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                quote: 'GreenKidSA transformed how our community handles illegal dumping. Reports are now actioned within 24 hours.',
                name: 'Community Leader',
                area: 'Mangaung, Free State',
              },
              {
                quote: 'As a collection driver, the task management system means I spend less time on paperwork and more time on the ground.',
                name: 'Field Worker',
                area: 'Bloemfontein North',
              },
              {
                quote: 'The rewards system has genuinely motivated residents to participate. We\'ve seen a 40% increase in correct waste sorting.',
                name: 'Ward Councillor',
                area: 'Free State',
              },
            ].map(({ quote, name, area }) => (
              <div key={name} className="bg-white border border-green-100 rounded-2xl p-7 flex flex-col gap-5">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-green-800/80 leading-relaxed text-sm italic flex-1">"{quote}"</p>
                <div>
                  <p className="font-semibold text-green-900 text-sm">{name}</p>
                  <p className="text-xs text-green-600">{area}</p>
                </div>
              </div>
            ))}
          </div>

         
          <div className="border border-green-200 rounded-3xl bg-white/60 p-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'CIPC Registered', sub: 'CK 2013/081559/07' },
              { icon: CheckCircle2, label: 'VAT Registered', sub: '4570272023' },
              { icon: Globe, label: 'CSD Verified', sub: 'MAAA0022909' },
              { icon: Award, label: 'Income Tax Compliant', sub: '9462265175' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 text-sm">{label}</p>
                  <p className="text-xs text-green-600 font-mono">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>*/}

      {/* ── CTA BAND ── */}
      <section className="bg-green-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">Ready to Make Your Environment Cleaner?</h2>
          <p className="text-green-200/70 mb-10 font-light leading-relaxed">
            Join thousands of South Africans already using GreenKidSA to report waste, earn rewards, and build cleaner communities — one collection at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="group inline-flex items-center justify-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm tracking-wide font-semibold hover:bg-green-50 transition-colors shadow-lg"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <Link href="/request-collection">
                <button className="group inline-flex items-center justify-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm tracking-wide font-semibold hover:bg-green-50 transition-colors shadow-lg">
                  Report Waste Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}
            <a href="mailto:info@greenkidsa.co.za" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white/90 px-8 py-4 rounded-full text-sm font-medium hover:bg-white/10 transition-colors">
              <Mail className="w-4 h-4" /> Contact Us
            </a>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultMode="login" />
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