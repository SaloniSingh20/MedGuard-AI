'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

const platform = [
  { href: '/verify',    label: 'Verify Medicine'      },
  { href: '/dashboard', label: 'Analytics Dashboard'  },
  { href: '/alerts',    label: 'Counterfeit Alerts'   },
  { href: '/settings',  label: 'Settings'             },
];

const standards = [
  'WHO INN Standards',
  'IP / BP / USP Pharmacopoeia',
  'CDSCO Schedule H / X',
  'DCGI Batch Compliance',
  'Schedule G / H1 References',
];

const tech = [
  { label: 'Tesseract.js',        sub: 'OCR text extraction'    },
  { label: 'LLaMA 3 (Ollama)',    sub: 'Local LLM reasoning'    },
  { label: 'Ethereum / Hardhat',  sub: 'Blockchain verification' },
  { label: 'MongoDB',             sub: 'Verification database'  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-700 p-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black text-white tracking-tight">
                Med<span className="text-blue-400">Guard</span> AI
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered medicine verification using OCR, LLM reasoning, and
              blockchain-backed verification history.
            </p>
            <div className="flex items-center gap-2">
              <span className="status-dot w-1.5 h-1.5" />
              <span className="text-xs text-slate-500">All systems operational</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed border-l-2 border-slate-700 pl-3">
              For verification assistance only. Not a replacement for professional pharmaceutical advice.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Platform</h3>
            <ul className="space-y-3">
              {platform.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Standards</h3>
            <ul className="space-y-3">
              {standards.map(s => (
                <li key={s} className="text-sm text-slate-600">{s}</li>
              ))}
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Technology</h3>
            <ul className="space-y-3">
              {tech.map(({ label, sub }) => (
                <li key={label}>
                  <p className="text-sm text-slate-400 font-medium">{label}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} MedGuard AI — Built for healthcare professionals and consumers.
          </p>
          <p className="text-xs text-slate-700">Next.js · Express · Python · Solidity</p>
        </div>
      </div>
    </footer>
  );
}
