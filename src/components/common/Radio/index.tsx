import { useId } from 'react'
import type { ChangeEventHandler, InputHTMLAttributes } from 'react'

export interface RadioProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'checked' | 'defaultChecked' | 'onChange'
  > {
  label: string
  checked: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
}

function Radio({
  label,
  checked,
  onChange,
  id,
  className = '',
  disabled = false,
  ...props
}: RadioProps) {
  const generatedId = useId()
  const radioId = id ?? generatedId

  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input
        {...props}
        id={radioId}
        type="radio"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed"
      />
      <label
        htmlFor={radioId}
        className={`text-sm ${disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'}`}
      >
        {label}
      </label>
    </div>
  )
}

export default Radio
