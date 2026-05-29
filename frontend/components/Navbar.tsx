'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Activity, Bell, Settings, ScanLine, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',          label: 'Home',      icon: Shield   },
  { href: '/verify',    label: 'Verify',    icon: ScanLine },
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/alerts',    label: 'Alerts',    icon: Bell     },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
            <div className="rounded-xl bg-blue-700 p-2 shadow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-black text-gray-900 tracking-tight">
                Med<span className="text-blue-700">Guard</span> AI
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="status-dot w-1.5 h-1.5 shrink-0" />
                <span className="text-[10px] text-gray-400 font-medium leading-none">Systems Online</span>
              </div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors shadow-sm"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Verify Medicine
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden overflow-hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-blue-500" />}
                  </Link>
                );
              })}
              <div className="pt-2 pb-1">
                <Link
                  href="/verify"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 transition-colors"
                >
                  <ScanLine className="h-4 w-4" />
                  Verify a Medicine
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
