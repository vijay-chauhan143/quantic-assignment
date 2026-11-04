import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { controlClasses, errorClasses, labelClasses } from '../styles'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

function Textarea({
  label,
  error,
  id,
  rows = 4,
  className = '',
  required = false,
  'aria-describedby': describedBy,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const errorId = `${textareaId}-error`

  return (
    <div>
      {label && (
        <label className={labelClasses} htmlFor={textareaId}>
          {label}
          {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error ? errorId : undefined]
          .filter(Boolean)
          .join(' ') || undefined}
        className={`${controlClasses} min-h-24 resize-y ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'} ${className}`}
      />
      {error && (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Textarea
