import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${variantClasses[variant]} ${className}`}
    />
  )
}

export default Badge
