import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

export interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}

function Modal({
  isOpen,
  title,
  children,
  onClose,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`fixed inset-0 m-auto max-h-[min(90vh,48rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center rounded-md text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  )
}

export default Modal
