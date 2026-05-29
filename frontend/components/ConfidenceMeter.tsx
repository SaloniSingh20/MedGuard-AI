'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  score: number;
  status: string;
  className?: string;
}

export default function ConfidenceMeter({ score, status, className }: ConfidenceMeterProps) {
  const s = Math.max(0, Math.min(100, score));

  const stroke =
    status === 'authentic'   ? 'stroke-green-500'  :
    status === 'counterfeit' ? 'stroke-red-500'     : 'stroke-amber-500';

  const textColor =
    status === 'authentic'   ? 'text-green-700'     :
    status === 'counterfeit' ? 'text-red-700'        : 'text-amber-700';

  const barColor =
    status === 'authentic'   ? 'bg-green-500'       :
    status === 'counterfeit' ? 'bg-red-500'          : 'bg-amber-500';

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (s / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className={stroke}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={cn('text-2xl font-black', textColor)}
          >
            {s}%
          </motion.span>
          <span className="text-xs text-gray-400">confidence</span>
        </div>
      </div>

      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${s}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
