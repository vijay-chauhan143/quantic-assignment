import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-indigo-600',
  secondary:
    'border border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:outline-slate-500',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-indigo-600',
  danger:
    'border border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600',
  ghost:
    'border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-indigo-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-11 px-5 text-base',
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  )
}

export default Button
