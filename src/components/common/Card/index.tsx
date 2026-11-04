import type { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    />
  )
}

export default Card
