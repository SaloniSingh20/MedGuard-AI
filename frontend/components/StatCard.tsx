'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'red' | 'amber';
  delay?: number;
}

const colorMap = {
  blue:    { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200'   },
  emerald: { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-200'  },
  red:     { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-200'    },
  amber:   { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-200'  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', delay = 0 }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow', c.border)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="mt-2 text-3xl font-black text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn('rounded-xl p-3 border', c.bg, c.border)}>
          <Icon className={cn('h-6 w-6', c.icon)} />
        </div>
      </div>
    </motion.div>
  );
}
