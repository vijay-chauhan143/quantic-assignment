export type LoaderSize = 'sm' | 'md' | 'lg'

export interface LoaderProps {
  size?: LoaderSize
  label?: string
  className?: string
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-6 border-[3px]',
  lg: 'size-8 border-4',
}

function Loader({
  size = 'md',
  label = 'Loading',
  className = '',
}: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-indigo-600 border-r-transparent motion-reduce:animate-none ${sizeClasses[size]} ${className}`}
    />
  )
}

export default Loader
