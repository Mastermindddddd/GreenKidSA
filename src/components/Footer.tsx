// @ts-nocheck
'use client'
import {
  Leaf, Mail, Phone, MapPin, Globe, ArrowUpRight,
  Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import Image from "next/image"

const poppins = Poppins({ weight: ['300', '400', '600'], subsets: ['latin'], display: 'swap' })

const NAV = [
  {
    heading: 'Platform',
    links: [
      { label: 'Report Waste', href: '/request-collection' },
      { label: 'Collect Waste', href: '/collect-waste' },
      { label: 'Rewards', href: '/rewards' },
      { label: 'Leaderboard', href: '/leaderboard' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About GreenKidSA', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Updates', href: '#updates' },
      { label: 'Contact', href: 'mailto:info@greenkidsa.co.za' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'POPIA Compliance', href: '/popia' },
    ],
  },
]

const SOCIAL = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter / X' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className={`${poppins.className} bg-green-950 text-white`}>
      {/* Top bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center">
              <Image
                  src="/logo.png"
                  alt="GreenKidSA Logo"
                  width={72}
                  height={72}
                  className="sm:block object-contain shrink-0"
                />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Green<span className="text-green-400">KidSA</span>
            </span>
          </div>
          <p className="text-xs text-green-400/70 text-center sm:text-right font-light">
            Environmental Operations · South Africa · Est. 2013
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">

        {/* Brand col */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <p className="text-sm text-green-200/60 leading-relaxed font-light max-w-xs">
            GreenKidSA connects communities, waste workers, and environmental authorities through intelligent digital operations — for a cleaner, greener South Africa.
          </p>

          {/* Contact details */}
          <div className="space-y-3">
            <ContactItem icon={MapPin}>
              20 President Brand Street, Bloemfontein, Free State
            </ContactItem>
            <ContactItem icon={Phone}>
              <span>Office: </span>
              <a href="tel:0515073592" className="hover:text-green-300 transition-colors">051 507 3592</a>
              <span className="mx-1 text-green-700">·</span>
              <span>Fax: </span>
              <a href="tel:0515073483" className="hover:text-green-300 transition-colors">051 507 3483</a>
            </ContactItem>
            <ContactItem icon={Phone}>
              <span>Cell: </span>
              <a href="tel:0734133004" className="hover:text-green-300 transition-colors">073 413 3004</a>
              <span className="mx-1 text-green-700">·</span>
              <a href="tel:0834968299" className="hover:text-green-300 transition-colors">083 496 8299</a>
            </ContactItem>
            <ContactItem icon={Mail}>
              <a href="mailto:info@greenkidsa.co.za" className="hover:text-green-300 transition-colors">
                info@greenkidsa.co.za
              </a>
            </ContactItem>
          </div>

          {/* Social */}
          <div className="flex gap-3">
            {SOCIAL.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-green-700/50 hover:border-green-600 transition-all duration-200"
              >
                <Icon className="w-4 h-4 text-green-300" />
              </a>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {NAV.map(({ heading, links }) => (
          <div key={heading}>
            <p className="text-xs uppercase tracking-[0.25em] text-green-500 mb-5 font-semibold">{heading}</p>
            <ul className="space-y-3">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1 text-sm text-green-200/60 hover:text-green-200 transition-colors font-light"
                  >
                    {label}
                    {href.startsWith('mailto') && (
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Registration details strip */}
      {/*<div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap gap-x-8 gap-y-2 justify-center sm:justify-start">
          {[
            { label: 'Reg No', value: 'CK 2013/081559/07' },
            { label: 'VAT', value: '4570272023' },
            { label: 'Income Tax', value: '9462265175' },
            { label: 'CSD', value: 'MAAA0022909' },
          ].map(({ label, value }) => (
            <span key={label} className="text-xs text-green-700 font-light">
              <span className="text-green-500 font-medium">{label}:</span>{' '}
              <span className="font-mono">{value}</span>
            </span>
          ))}
        </div>
      </div>*/}

      {/* Copyright */}
      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-green-700/60 font-light">
          <p>© {new Date().getFullYear()} GreenKidSA (Pty) Ltd. All rights reserved.</p>
          <p>Proudly South African 🇿🇦</p>
        </div>
      </div>
    </footer>
  )
}

/* ── Helper ── */
function ContactItem({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-green-200/60 font-light leading-relaxed">{children}</p>
    </div>
  )
}