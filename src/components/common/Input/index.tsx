import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { controlClasses, errorClasses, labelClasses } from '../styles'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

function Input({
  label,
  error,
  id,
  className = '',
  required = false,
  'aria-describedby': describedBy,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div>
      {label && (
        <label className={labelClasses} htmlFor={inputId}>
          {label}
          {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error ? errorId : undefined]
          .filter(Boolean)
          .join(' ') || undefined}
        className={`${controlClasses} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'} ${className}`}
      />
      {error && (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
