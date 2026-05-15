// @ts-nocheck
'use client'
import {
  Leaf, Eye, Target, Heart, ShieldCheck, Zap,
  Handshake, Users, Recycle, Globe, ArrowRight,
  CheckCircle2, Building2, TreePine, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export default function AboutPage() {
  return (
    <div className={`${poppins.className} bg-[#f0f4f1]`}>
      <style>{`
        @keyframes blurIn {
          from { opacity: 0; filter: blur(10px); transform: translateY(12px); }
          to   { opacity: 1; filter: blur(0);   transform: translateY(0); }
        }
        .blur-in { animation: blurIn 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .section-line {
          background: linear-gradient(90deg, transparent, #86efac, transparent);
          height: 1px;
        }
        .diagonal-bg {
          background: linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 100%);
        }
      `}</style>

      {/* ── PAGE HERO ── */}
      <section className="diagonal-bg relative overflow-hidden pt-32 pb-24 px-6">
        {/* Decorative rings */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] border border-white/5 rounded-full" />
        <div className="absolute -top-16 -right-16 w-[350px] h-[350px] border border-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-900/40 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-6xl mx-auto relative z-10">
          <span className="blur-in inline-block text-xs uppercase tracking-[0.35em] text-green-400 mb-5 font-medium" style={{ animationDelay: '0.1s' }}>
            Our Story
          </span>
          <h1 className="blur-in text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] mb-8 max-w-3xl" style={{ animationDelay: '0.25s' }}>
            Who We Are &amp;<br />
            <span className="text-green-400">Why We Exist</span>
          </h1>
          <p className="blur-in text-green-200/70 text-lg font-light leading-relaxed max-w-2xl" style={{ animationDelay: '0.4s' }}>
            GreenKidSA is a proudly South African, BEE-compliant waste management and recycling company — born from a commitment to solving one of the Free State's most pressing environmental challenges.
          </p>
        </div>
      </section>

      {/* ── COMPANY PROFILE ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Company Profile</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900 leading-tight mb-6">
              Built on Experience,<br />Driven by Purpose
            </h2>
            <div className="space-y-4 text-green-800/70 font-light leading-relaxed">
              <p>
                <strong className="font-semibold text-green-900">Green Kid Enterprise (Pty) Ltd</strong> is a holding company that owns GreenKidSA — a well-established yet innovative Broad-Based Black Economic Empowerment (BEE) waste management and recycling company.
              </p>
              <p>
                Our record of excellent service attests to our passion, vast experience, and high ethical standards. Driven by a well-qualified and energetic team of professionals, we inspire confidence and peace of mind in our clients.
              </p>
              <p>
                GreenKidSA was established in direct response to the electronic and solid-waste problems most municipalities in the Free State are facing at their landfills. Waste management has become a fast-growing problem in South Africa, with devastating impacts on communities and the environment.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { label: 'BEE Compliant', icon: CheckCircle2 },
                { label: 'CIPC Registered', icon: Building2 },
                { label: 'VAT Registered', icon: ShieldCheck },
                { label: 'CSD Verified', icon: Globe },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-medium">
                  <Icon className="w-3.5 h-3.5 text-green-600" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Problem context panel */}
          <div className="bg-green-900 rounded-3xl p-8 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">The Problem We're Solving</h3>
                <p className="text-green-200/60 text-sm font-light leading-relaxed">
                  South Africa faces a critical waste management crisis that demands urgent, scalable solutions.
                </p>
              </div>
            </div>

            <div className="section-line" />

            <div className="space-y-5">
              {[
                {
                  figure: '60.2M m³',
                  label: 'Total waste generated in South Africa in 2010 alone',
                },
                {
                  figure: '87%',
                  label: 'of municipalities lack capacity or infrastructure for waste minimisation',
                },
                {
                  figure: '44.9%',
                  label: 'of households had no refuse removal service in 2009 (StatsSA)',
                },
              ].map(({ figure, label }) => (
                <div key={figure} className="flex items-start gap-4">
                  <span className="text-2xl font-semibold text-green-400 flex-shrink-0 leading-none mt-0.5">{figure}</span>
                  <p className="text-green-200/60 text-sm font-light leading-relaxed">{label}</p>
                </div>
              ))}
            </div>

            <div className="section-line" />

            <p className="text-green-300/70 text-sm font-light italic">
              Sources: Muzenda et al., 2011 · Statistics South Africa, 2010
            </p>
          </div>
        </div>
      </section>

      <div className="section-line max-w-6xl mx-auto px-6" />

      {/* ── VISION & MISSION ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Direction</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-green-900">Vision &amp; Mission</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Vision */}
          <div className="relative bg-white border border-green-100 rounded-3xl p-10 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-100 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-7">
                <Eye className="w-7 h-7 text-green-700" />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-green-500 font-semibold mb-3 block">Our Vision</span>
              <p className="text-green-900 text-xl font-semibold leading-snug mb-4">
                An influential leader in waste management across the Free State and South Africa.
              </p>
              <p className="text-green-700/70 font-light leading-relaxed text-sm">
                GreenKidSA aims to work towards zero waste to landfill, whilst inspiring others on the benefits of responsible waste management and environmental stewardship.
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="relative bg-green-900 rounded-3xl p-10 overflow-hidden group hover:shadow-xl hover:shadow-green-900/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-800/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-green-700/60 rounded-2xl flex items-center justify-center mb-7">
                <Target className="w-7 h-7 text-green-300" />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-green-400 font-semibold mb-3 block">Our Mission</span>
              <p className="text-white text-xl font-semibold leading-snug mb-4">
                One-stop waste management service for Africa — convenient, accessible, and affordable.
              </p>
              <p className="text-green-200/60 font-light leading-relaxed text-sm">
                We strive to provide communities, businesses, and municipalities with comprehensive waste solutions at the most convenient time and at rates that make environmental responsibility achievable for all.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-line max-w-6xl mx-auto px-6" />

      {/* ── VALUES (HASS) ── */}
      <section className="bg-gradient-to-b from-[#f0f4f1] to-[#e6f0e9] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Core Values</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900 mb-3">The HASS Principles</h2>
            <p className="text-green-700/60 font-light max-w-md mx-auto">
              Four pillars that define how we work, how we treat our clients, and what we stand for.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                letter: 'H',
                value: 'Honesty',
                icon: ShieldCheck,
                desc: 'We are committed to promoting honesty and ethical business principles with our present and future clients — no shortcuts, no compromises.',
                color: 'from-green-600 to-emerald-700',
              },
              {
                letter: 'A',
                value: 'Availability',
                icon: Zap,
                desc: "We are always ready to meet the market's needs — responsive, reachable, and reliable when our communities need us most.",
                color: 'from-teal-600 to-green-700',
              },
              {
                letter: 'S',
                value: 'Service',
                icon: Handshake,
                desc: 'We are responsive to current needs and dedicated to meeting them with speed, care, and a standard of excellence that sets us apart.',
                color: 'from-emerald-600 to-teal-700',
              },
              {
                letter: 'S',
                value: 'Safety',
                icon: Heart,
                desc: 'Safety is the key driver towards achieving success in our tasks — protecting our workers, communities, and the environment in everything we do.',
                color: 'from-green-700 to-emerald-800',
              },
            ].map(({ letter, value, icon: Icon, desc, color }) => (
              <div key={value} className="bg-white border border-green-100 rounded-2xl p-8 flex flex-col gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <span className="text-white text-xl font-bold">{letter}</span>
                  </div>
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">{value}</h3>
                  <p className="text-sm text-green-700/70 leading-relaxed font-light">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY IMPACT ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — impact narrative */}
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-green-600 mb-4 font-medium">Community Impact</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-green-900 leading-tight mb-6">
              Transforming Communities Through Responsible Waste Management
            </h2>
            <div className="space-y-4 text-green-800/70 font-light leading-relaxed">
              <p>
                GreenKidSA's digital platform connects residents directly with waste collection infrastructure, closing the gap between the 45% of households previously unserved by municipal collection.
              </p>
              <p>
                Through our BanQu-powered rewards system, community members who sort and deliver recyclables earn real money — immediately spendable at Shoprite, Checkers, Pick 'n Pay, Clicks, Dischem, and other participating merchants, or transferable to any South African bank account.
              </p>
              <p>
                We believe environmental responsibility should be rewarded, not just expected. That's why we've built economic incentives into the very core of our recycling model.
              </p>
            </div>
          </div>

          {/* Right — impact pillars */}
          <div className="space-y-4">
            {[
              {
                icon: Users,
                title: 'Economic Empowerment',
                desc: 'Residents earn income for recyclables, with payments instantly accessible via participating retailers or cash withdrawal.',
                bg: 'bg-green-50 border-green-200',
              },
              {
                icon: Recycle,
                title: 'Landfill Diversion',
                desc: 'By diverting recyclable plastics, paper, metal, and glass from landfill, we reduce the environmental burden on Free State municipalities.',
                bg: 'bg-emerald-50 border-emerald-200',
              },
              {
                icon: TreePine,
                title: 'Environmental Education',
                desc: 'Our community training programmes equip residents and businesses with the knowledge and skills to manage waste responsibly.',
                bg: 'bg-teal-50 border-teal-200',
              },
              {
                icon: Globe,
                title: 'Digital Inclusion',
                desc: 'SMS confirmations, digital receipts, and the GreenKidSA platform bring modern infrastructure to communities often left behind by tech.',
                bg: 'bg-green-50 border-green-200',
              },
            ].map(({ icon: Icon, title, desc, bg }) => (
              <div key={title} className={`flex gap-5 border rounded-2xl p-5 ${bg}`}>
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">{title}</h4>
                  <p className="text-sm text-green-700/70 font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-green-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Leaf className="w-10 h-10 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">
            Join the GreenKidSA Movement
          </h2>
          <p className="text-green-200/60 font-light leading-relaxed mb-10">
            Whether you're a resident, business, or municipality — there's a role for you in building a cleaner South Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <button className="group inline-flex items-center gap-3 bg-white text-green-900 px-8 py-4 rounded-full text-sm font-semibold hover:bg-green-50 transition-colors shadow-lg">
                Explore Our Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a href="mailto:info@greenkidsa.co.za" className="inline-flex items-center gap-2 border border-white/30 text-white/90 px-8 py-4 rounded-full text-sm font-medium hover:bg-white/10 transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}