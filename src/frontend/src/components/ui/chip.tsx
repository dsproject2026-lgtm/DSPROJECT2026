import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const chipVariants = cva('inline-flex items-center rounded-full font-medium', {
  variants: {
    color: {
      default: '',
      success: '',
      danger: '',
      warning: '',
      primary: '',
    },
    variant: {
      soft: '',
      solid: '',
      outline: '',
    },
    size: {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-3.5 py-2 text-sm',
    },
  },
  compoundVariants: [
    { color: 'default', variant: 'soft', className: 'bg-[#EEF1F6] text-[#4B5563]' },
    { color: 'default', variant: 'solid', className: 'bg-[#4B5563] text-white' },
    { color: 'default', variant: 'outline', className: 'border border-[#CDD3DE] text-[#4B5563]' },
    { color: 'success', variant: 'soft', className: 'bg-[#DEF7EC] text-[#057A55]' },
    { color: 'success', variant: 'solid', className: 'bg-[#057A55] text-white' },
    { color: 'success', variant: 'outline', className: 'border border-[#6BB99C] text-[#057A55]' },
    { color: 'danger', variant: 'soft', className: 'bg-[#FDE8E8] text-[#C81E1E]' },
    { color: 'danger', variant: 'solid', className: 'bg-[#C81E1E] text-white' },
    { color: 'danger', variant: 'outline', className: 'border border-[#E49494] text-[#C81E1E]' },
    { color: 'warning', variant: 'soft', className: 'bg-[#FEF3C7] text-[#C27803]' },
    { color: 'warning', variant: 'solid', className: 'bg-[#C27803] text-white' },
    { color: 'warning', variant: 'outline', className: 'border border-[#E3BE78] text-[#C27803]' },
    { color: 'primary', variant: 'soft', className: 'bg-[#EBF2FF] text-[#1A56DB]' },
    { color: 'primary', variant: 'solid', className: 'bg-[#1A56DB] text-white' },
    { color: 'primary', variant: 'outline', className: 'border border-[#A7BFF0] text-[#1A56DB]' },
  ],
  defaultVariants: {
    color: 'default',
    variant: 'soft',
    size: 'md',
  },
});

export interface ChipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>, VariantProps<typeof chipVariants> {}

export function Chip({ className, color, variant, size, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ color, variant, size }), className)} {...props} />;
}
