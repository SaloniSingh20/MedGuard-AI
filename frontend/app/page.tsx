'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, ScanLine, Activity, Lock, ArrowRight, Brain,
  Database, GitBranch, CheckCircle2, CheckCheck,
  Zap, Server, Cpu, AlertTriangle, XCircle, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Hero: sample result card ─────────────────────────────────────────────────
function ResultCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Green header */}
      <div className="flex items-center justify-between px-5 py-4 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-bold text-green-800 tracking-wide text-sm">AUTHENTIC</span>
        </div>
        <span className="text-[11px] font-mono text-gray-400">VRF-20260530</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Medicine */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">Verified Medicine</p>
          <p className="text-gray-900 font-bold text-lg leading-tight">Paracetamol 500mg</p>
          <p className="text-gray-500 text-sm mt-0.5">Tablets IP · Cipla Ltd., Mumbai</p>
        </div>

        {/* Score */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500">Authenticity Score</span>
            <span className="font-bold text-green-700">94 / 100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '94%' }}
              transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Batch No.',  value: 'PCM-2024-0312', mono: true },
            { label: 'Expiry',     value: '02/2026'                  },
            { label: 'Fields',     value: '9 / 10',  green: true     },
            { label: 'Blockchain', value: '✓ Verified', green: true  },
          ].map(({ label, value, mono, green }) => (
            <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <p className="text-gray-400 mb-0.5">{label}</p>
              <p className={cn('font-semibold', green ? 'text-green-700' : 'text-gray-900', mono && 'font-mono text-[11px]')}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Checklist pills */}
        <div className="flex flex-wrap gap-1.5">
          {['Manufacturer ✓', 'Schedule H ✓', 'IP Ref ✓', 'Storage ✓'].map(t => (
            <span key={t} className="text-[11px] bg-green-50 border border-green-200 text-green-700 rounded-full px-2 py-0.5">{t}</span>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-100">
          30 May 2026 · OCR + LLaMA 3 · 1.4s
        </p>
      </div>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: '3,40,000+', label: 'Medicines Verified' },
  { value: '99.2%',     label: 'Detection Accuracy' },
  { value: '12,000+',   label: 'Counterfeits Blocked' },
  { value: 'Zero',      label: 'Cloud Image Storage' },
];

const steps = [
  { n: '01', icon: Package,   title: 'Upload the Label',      desc: 'Photograph the medicine package label — JPEG, PNG or WebP, up to 10 MB.' },
  { n: '02', icon: Cpu,       title: 'OCR Extraction',        desc: 'Tesseract scans the image and pulls name, batch, expiry, manufacturer and composition.' },
  { n: '03', icon: Brain,     title: 'AI + Blockchain',       desc: 'LLaMA 3 reasons over the text; blockchain history is queried for duplicate batch flags.' },
  { n: '04', icon: Shield,    title: 'Verdict Delivered',     desc: 'Authentic, Suspicious, or Counterfeit — with a confidence score and field-by-field checklist.' },
];

const features = [
  { icon: Cpu,        title: 'Tesseract OCR',          desc: 'Two page-segmentation passes pick the highest-confidence text extraction from the medicine label.' },
  { icon: Brain,      title: 'LLaMA 3 Reasoning',      desc: 'A 10-point pharmaceutical authentication protocol checks every field from batch format to regulatory reference.' },
  { icon: GitBranch,  title: 'Blockchain Ledger',      desc: 'Immutable on-chain logs catch duplicate batch submissions and medicines with prior suspicious verdicts.' },
  { icon: Database,   title: 'Pharma Database',        desc: 'Cross-referenced against 500+ manufacturers, approved INN drug names, and known composition patterns.' },
  { icon: Zap,        title: 'Confidence Fusion',      desc: 'OCR 15% · LLM 50% · Field completeness 25% · Database validation 10% — one calibrated score.' },
  { icon: Lock,       title: 'Privacy First',          desc: 'The LLM runs locally via Ollama. Images are deleted after OCR. Nothing leaves your server.' },
];

const verdicts = [
  {
    icon: CheckCircle2,
    label: 'Authentic',
    cls:   { border: 'border-green-200', bg: 'bg-green-50', icon: 'text-green-600', head: 'text-green-800', body: 'text-green-700' },
    desc:  'All critical packaging fields present, recognized manufacturer, valid and consistent dates.',
  },
  {
    icon: AlertTriangle,
    label: 'Suspicious',
    cls:   { border: 'border-amber-200', bg: 'bg-amber-50', icon: 'text-amber-500', head: 'text-amber-800', body: 'text-amber-700' },
    desc:  '1–2 fields missing or minor inconsistencies detected. Consult a licensed pharmacist before use.',
  },
  {
    icon: XCircle,
    label: 'Counterfeit',
    cls:   { border: 'border-red-200', bg: 'bg-red-50', icon: 'text-red-600', head: 'text-red-800', body: 'text-red-700' },
    desc:  'Multiple red flags — unknown manufacturer, impossible dates, violated batch format. Do not consume.',
  },
];

const privacyPoints = [
  { icon: Server, title: 'Self-hosted pipeline',  desc: 'OCR, AI reasoning, and blockchain all run on your own servers — no third-party processing.' },
  { icon: Lock,   title: 'Images deleted on OCR', desc: 'Uploaded files are removed from disk the moment text extraction finishes.' },
  { icon: Brain,  title: 'Local LLM only',        desc: 'LLaMA 3 runs via Ollama on your machine. No medicine data is sent to external AI APIs.' },
  { icon: Shield, title: 'Open source',           desc: 'Every part of the analysis pipeline is auditable. No hidden scoring or black-box models.' },
];

const compliance = ['WHO INN Standards', 'IP / BP / USP Pharmacopoeia', 'CDSCO Schedule H / X', 'DCGI Batch Format', 'Blockchain Immutable Log'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div className="space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
              >
                <Shield className="h-3.5 w-3.5" />
                Pharmaceutical Grade Verification
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
                className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight"
              >
                Stop Counterfeit
                <span className="block text-blue-700 mt-1">Medicine</span>
                <span className="block">Before It Harms.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="text-lg text-gray-600 leading-relaxed max-w-lg"
              >
                MedGuard AI uses <strong className="text-gray-800 font-semibold">Tesseract OCR</strong>,{' '}
                <strong className="text-gray-800 font-semibold">LLaMA 3 reasoning</strong>, and{' '}
                <strong className="text-gray-800 font-semibold">blockchain verification</strong> to
                classify medicine packages as Authentic, Suspicious, or Counterfeit — in under 30 seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href="/verify"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-3.5 text-base font-semibold text-white hover:bg-blue-800 transition-colors shadow-sm"
                >
                  <ScanLine className="h-5 w-5" />
                  Verify a Medicine
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <Activity className="h-5 w-5" />
                  View Dashboard
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-x-5 gap-y-2"
              >
                {[
                  { icon: CheckCheck, text: 'Zero cloud storage' },
                  { icon: Shield,     text: 'Open source' },
                  { icon: Lock,       text: 'Local LLM' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Icon className="h-3.5 w-3.5 text-blue-600" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — result card */}
            <div className="flex justify-center lg:justify-end">
              <ResultCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-200">
            {stats.map(({ value, label }) => (
              <div key={label} className="px-8 py-10 text-center">
                <p className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{value}</p>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 shrink-0">
              Aligned with
            </span>
            {compliance.map(c => (
              <span key={c} className="text-sm text-gray-500 font-medium">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14">
            <p className="label-overline mb-3">The Process</p>
            <h2 className="text-4xl font-black text-gray-900">How Verification Works</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              Four automated stages take your photo from upload to a clinically precise verdict.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector (desktop only) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gray-200" />

            {steps.map(({ n, icon: Icon, title, desc }, i) => (
              <FadeIn key={n} delay={i * 0.09} className="flex flex-col items-center text-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white shadow-sm mb-5">
                  <Icon className="h-7 w-7 text-blue-600" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14">
            <p className="label-overline mb-3">Technology</p>
            <h2 className="text-4xl font-black text-gray-900">Six-Layer Verification Engine</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              Every scan runs six independent checks. Their scores are fused by a weighted confidence model.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FadeIn
                key={title}
                delay={i * 0.06}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="inline-flex rounded-xl bg-blue-50 border border-blue-100 p-2.5 mb-4">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERDICTS ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <p className="label-overline mb-3">Outcomes</p>
            <h2 className="text-4xl font-black text-gray-900">Three Possible Verdicts</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              Every scan ends with one clearly defined outcome — no ambiguous middle ground.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {verdicts.map(({ icon: Icon, label, cls, desc }, i) => (
              <FadeIn
                key={label}
                delay={i * 0.1}
                className={cn('rounded-2xl border p-7 text-center', cls.bg, cls.border)}
              >
                <div className={cn('inline-flex rounded-full p-3 mb-4', cls.bg)}>
                  <Icon className={cn('h-7 w-7', cls.icon)} />
                </div>
                <h3 className={cn('text-xl font-black mb-2', cls.head)}>{label}</h3>
                <p className={cn('text-sm leading-relaxed', cls.body)}>{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn className="space-y-5">
              <p className="label-overline">Security & Privacy</p>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">
                Your Data Never<br />Leaves Your Server.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                MedGuard AI is a local-first platform. The LLM runs on your hardware.
                Images are deleted after OCR. No medicine data is logged, transmitted, or stored externally.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {privacyPoints.map(({ icon: Icon, title, desc }, i) => (
                <FadeIn
                  key={title}
                  delay={i * 0.08}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 w-fit mb-3">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <FadeIn className="space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex rounded-2xl bg-white/10 p-3 mb-2">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white">Ready to Verify a Medicine?</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Upload a photo of any medicine package and receive an instant AI-powered
              authenticity verdict with a complete field-by-field breakdown.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/verify"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <ScanLine className="h-5 w-5" />
                Start Verification
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Activity className="h-5 w-5" />
                View Analytics
              </Link>
            </div>
            <p className="text-sm text-slate-500 pt-1">Free to use · No account required · Results in under 30 seconds</p>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
