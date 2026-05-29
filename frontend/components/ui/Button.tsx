import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400',
        ghost:       'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        link:        'text-blue-700 underline-offset-4 hover:underline',
        success:     'bg-emerald-600 text-white hover:bg-emerald-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-12 px-6 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
