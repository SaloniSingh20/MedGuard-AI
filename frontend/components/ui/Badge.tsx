import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-blue-700 text-white',
        secondary:   'border-gray-200 bg-gray-100 text-gray-700',
        destructive: 'border-red-200 bg-red-50 text-red-700',
        warning:     'border-amber-200 bg-amber-50 text-amber-800',
        success:     'border-green-200 bg-green-50 text-green-800',
        outline:     'border-gray-300 text-gray-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
