import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('inline-block rounded-full border-2 border-solid border-current border-r-transparent animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
    color: {
      default: 'text-[#4B5563]',
      accent: 'text-[#1A56DB]',
      success: 'text-[#057A55]',
      danger: 'text-[#C81E1E]',
      warning: 'text-[#C27803]',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string;
};

export function Spinner({ size, color, className }: SpinnerProps) {
  return <span className={cn(spinnerVariants({ size, color }), className)} />;
}
