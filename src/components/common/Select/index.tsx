import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { controlClasses, errorClasses, labelClasses } from '../styles'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  placeholder?: string
  error?: string
  options: SelectOption[]
}

function Select({
  label,
  placeholder = 'Select an option',
  error,
  options,
  id,
  className = '',
  required = false,
  'aria-describedby': describedBy,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div>
      {label && (
        <label className={labelClasses} htmlFor={selectId}>
          {label}
          {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        {...props}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error ? errorId : undefined]
          .filter(Boolean)
          .join(' ') || undefined}
        className={`${controlClasses} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'} ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
