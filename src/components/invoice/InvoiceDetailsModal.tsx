import { useEffect, useState } from 'react'
import { Badge, Button, Loader, Modal, Table } from '../common'
import type { TableColumn } from '../common'
import { getCustomerById } from '../../services/customerService'
import { getInvoiceById } from '../../services/invoiceService'
import type { Customer } from '../../types/customer'
import type { Invoice, InvoiceItem } from '../../types/invoice'

interface InvoiceDetailsModalProps {
  invoiceId: string | null
  onClose: () => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}

type InvoiceDetailsState =
  | {
      status: 'found'
      invoiceId: string
      invoice: Invoice
      customer: Customer | null
    }
  | { status: 'not-found'; invoiceId: string }
  | { status: 'error'; invoiceId: string; message: string }

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

function formatDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : dateFormatter.format(date)
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-slate-800">{value || '—'}</dd>
    </div>
  )
}

function InvoiceDetailsModal({
  invoiceId,
  onClose,
  onEdit,
  onDelete,
}: InvoiceDetailsModalProps) {
  const [details, setDetails] = useState<InvoiceDetailsState>()

  useEffect(() => {
    if (!invoiceId) return

    const requestedInvoiceId = invoiceId
    let isCurrentRequest = true

    async function loadDetails() {
      try {
        const invoice = await getInvoiceById(requestedInvoiceId)
        if (!isCurrentRequest) return
        if (!invoice) {
          setDetails({ status: 'not-found', invoiceId: requestedInvoiceId })
          return
        }

        const customer = await getCustomerById(invoice.customerId)
        if (!isCurrentRequest) return
        setDetails({
          status: 'found',
          invoiceId: requestedInvoiceId,
          invoice,
          customer,
        })
      } catch (error: unknown) {
        if (!isCurrentRequest) return
        setDetails({
          status: 'error',
          invoiceId: requestedInvoiceId,
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.',
        })
      }
    }

    void loadDetails()
    return () => {
      isCurrentRequest = false
    }
  }, [invoiceId])

  const currentDetails =
    details?.invoiceId === invoiceId ? details : undefined
  const itemColumns: TableColumn<InvoiceItem>[] = [
    {
      id: 'description',
      header: 'Description',
      renderCell: (item) => item.description,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      renderCell: (item) => item.quantity,
    },
    {
      id: 'price',
      header: 'Unit Price',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      renderCell: (item) => currencyFormatter.format(item.price),
    },
    {
      id: 'amount',
      header: 'Amount',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium text-slate-900',
      renderCell: (item) => currencyFormatter.format(item.amount),
    },
  ]

  return (
    <Modal
      isOpen={invoiceId !== null}
      title="Invoice Details"
      onClose={onClose}
      className="max-w-3xl"
    >
      {!currentDetails ? (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-600"
        >
          <Loader label="Loading invoice details" />
          Loading invoice details…
        </div>
      ) : currentDetails.status === 'not-found' ? (
        <div role="alert" className="py-8 text-center">
          <p className="font-medium text-slate-900">Invoice not found</p>
          <p className="mt-2 text-sm text-slate-600">
            This invoice may have been removed from IndexedDB.
          </p>
        </div>
      ) : currentDetails.status === 'error' ? (
        <div role="alert" className="py-8 text-center">
          <p className="font-medium text-red-700">
            Could not load invoice details.
          </p>
          <p className="mt-2 break-words text-sm text-slate-600">
            {currentDetails.message}
          </p>
        </div>
      ) : (
        <InvoiceDetails
          invoice={currentDetails.invoice}
          customer={currentDetails.customer}
          columns={itemColumns}
        />
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
        {currentDetails?.status === 'found' ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              onClick={() => onDelete(currentDetails.invoice)}
            >
              Delete Invoice
            </Button>
            <Button
              variant="primary"
              onClick={() => onEdit(currentDetails.invoice)}
            >
              Edit Invoice
            </Button>
          </div>
        ) : (
          <span />
        )}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}

function InvoiceDetails({
  invoice,
  customer,
  columns,
}: {
  invoice: Invoice
  customer: Customer | null
  columns: TableColumn<InvoiceItem>[]
}) {
  return (
    <div className="space-y-5">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            {invoice.invoiceNumber}
          </h3>
          <Badge variant={invoice.status === 'Paid' ? 'success' : 'warning'}>
            {invoice.status}
          </Badge>
        </div>
        <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Detail
            label="Customer"
            value={customer?.fullName ?? 'Customer unavailable'}
          />
          <Detail label="Email" value={customer?.email ?? '—'} />
          <Detail label="Phone" value={customer?.phone || 'Not provided'} />
          <Detail label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
          <Detail label="Due Date" value={formatDate(invoice.dueDate)} />
          {customer && (
            <Detail
              label="Billing Address"
              value={`${customer.billingAddress.addressLine}, ${customer.billingAddress.city}, ${customer.billingAddress.state} ${customer.billingAddress.postalCode}, ${customer.billingAddress.country}`}
            />
          )}
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Invoice Items
        </h3>
        <Table
          columns={columns}
          data={invoice.items}
          getRowKey={(item) => item.id}
          emptyMessage="No line items."
        />
      </section>

      <dl className="ml-auto grid max-w-xs grid-cols-2 gap-x-8 gap-y-2 border-t border-slate-200 pt-4 text-sm">
        <dt className="font-medium text-slate-600">Subtotal</dt>
        <dd className="text-right font-medium text-slate-900">
          {currencyFormatter.format(invoice.subtotal)}
        </dd>
        <dt className="font-semibold text-slate-900">Total</dt>
        <dd className="text-right font-semibold text-slate-900">
          {currencyFormatter.format(invoice.total)}
        </dd>
      </dl>
    </div>
  )
}

export default InvoiceDetailsModal
