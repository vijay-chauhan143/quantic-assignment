import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Input,
  Loader,
  Modal,
  Select,
  Table,
} from '../components/common'
import type { SelectOption, TableColumn } from '../components/common'
import InvoiceDetailsModal from '../components/invoice/InvoiceDetailsModal'
import { getAllCustomers } from '../services/customerService'
import {
  deleteInvoice,
  getAllInvoices,
  updateInvoice,
} from '../services/invoiceService'
import type { Customer } from '../types/customer'
import type { Invoice, InvoiceStatus } from '../types/invoice'

type InvoiceSort = 'date-newest' | 'date-oldest' | 'total-highest' | 'total-lowest'

interface InvoiceRow extends Invoice {
  customerName: string
}

function isInvoiceSort(value: string): value is InvoiceSort {
  return [
    'date-newest',
    'date-oldest',
    'total-highest',
    'total-lowest',
  ].includes(value)
}

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return value === 'Paid' || value === 'Unpaid'
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

function formatInvoiceDate(value: string): string {
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

function InvoiceListing() {
  const location = useLocation()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<InvoiceSort>('date-newest')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  )
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(
    null,
  )
  const [feedback, setFeedback] = useState<string>()
  const [feedbackError, setFeedbackError] = useState(false)
  const navigationState: unknown = location.state
  const editFeedback =
    typeof navigationState === 'object' &&
    navigationState !== null &&
    'invoiceFeedback' in navigationState &&
    typeof navigationState.invoiceFeedback === 'string'
      ? navigationState.invoiceFeedback
      : undefined

  useEffect(() => {
    let isCurrentRequest = true

    Promise.all([getAllInvoices(), getAllCustomers()])
      .then(([loadedInvoices, loadedCustomers]) => {
        if (!isCurrentRequest) return
        setInvoices(loadedInvoices)
        setCustomers(loadedCustomers)
        setError(undefined)
      })
      .catch((loadError: unknown) => {
        if (!isCurrentRequest) return
        setError(
          loadError instanceof Error
            ? `Could not load invoices: ${loadError.message}`
            : 'Could not load invoices from IndexedDB. Please try again.',
        )
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [location.key, reloadKey])

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.fullName])),
    [customers],
  )

  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.fullName,
      })),
    [customers],
  )

  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = invoices
      .filter((invoice) => {
        const customerName =
          customerNames.get(invoice.customerId) ?? 'Customer unavailable'
        return (
          (!query ||
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            customerName.toLowerCase().includes(query)) &&
          (!customerFilter || invoice.customerId === customerFilter) &&
          (!statusFilter ||
            (isInvoiceStatus(statusFilter) && invoice.status === statusFilter))
        )
      })
      .map((invoice): InvoiceRow => ({
        ...invoice,
        customerName:
          customerNames.get(invoice.customerId) ?? 'Customer unavailable',
      }))

    return filtered.sort((first, second) => {
      switch (sort) {
        case 'date-oldest':
          return first.invoiceDate.localeCompare(second.invoiceDate)
        case 'total-highest':
          return second.total - first.total
        case 'total-lowest':
          return first.total - second.total
        case 'date-newest':
        default:
          return second.invoiceDate.localeCompare(first.invoiceDate)
      }
    })
  }, [customerFilter, customerNames, invoices, search, sort, statusFilter])

  const columns: TableColumn<InvoiceRow>[] = [
    {
      id: 'invoice-number',
      header: 'Invoice Number',
      renderCell: (invoice) => (
        <span className="font-medium text-slate-900">
          {invoice.invoiceNumber}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer Name',
      renderCell: (invoice) => invoice.customerName,
    },
    {
      id: 'invoice-date',
      header: 'Invoice Date',
      renderCell: (invoice) => formatInvoiceDate(invoice.invoiceDate),
    },
    {
      id: 'due-date',
      header: 'Due Date',
      renderCell: (invoice) => formatInvoiceDate(invoice.dueDate),
    },
    {
      id: 'total',
      header: 'Total Amount',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium text-slate-900',
      renderCell: (invoice) => currencyFormatter.format(invoice.total),
    },
    {
      id: 'status',
      header: 'Payment Status',
      renderCell: (invoice) => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={invoice.status === 'Paid' ? 'success' : 'warning'}>
            {invoice.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            disabled={processingInvoiceId === invoice.id}
            aria-label={`Mark ${invoice.invoiceNumber} ${invoice.status === 'Paid' ? 'Unpaid' : 'Paid'}`}
            onClick={() => void togglePaymentStatus(invoice)}
          >
            Mark {invoice.status === 'Paid' ? 'Unpaid' : 'Paid'}
          </Button>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      renderCell: (invoice) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View ${invoice.invoiceNumber}`}
            onClick={() => setSelectedInvoiceId(invoice.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ]

  async function togglePaymentStatus(invoice: Invoice) {
    setProcessingInvoiceId(invoice.id)
    setFeedback(undefined)
    setFeedbackError(false)

    try {
      const updatedInvoice = await updateInvoice(invoice.id, {
        customerId: invoice.customerId,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        items: invoice.items.map(({ description, quantity, price }) => ({
          description,
          quantity,
          price,
        })),
        status: invoice.status === 'Paid' ? 'Unpaid' : 'Paid',
      })
      setFeedback(
        `Invoice ${updatedInvoice.invoiceNumber} marked ${updatedInvoice.status}.`,
      )
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (updateError: unknown) {
      setFeedbackError(true)
      setFeedback(
        updateError instanceof Error
          ? `Could not update payment status: ${updateError.message}`
          : 'Could not update the invoice payment status.',
      )
    } finally {
      setProcessingInvoiceId(null)
    }
  }

  async function confirmDelete() {
    if (!invoiceToDelete) return

    setIsDeleting(true)
    setDeleteError(undefined)

    try {
      await deleteInvoice(invoiceToDelete.id)
      setFeedback(`Invoice ${invoiceToDelete.invoiceNumber} was deleted.`)
      setFeedbackError(false)
      setInvoiceToDelete(null)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (deleteFailure: unknown) {
      setDeleteError(
        deleteFailure instanceof Error
          ? `Could not delete invoice: ${deleteFailure.message}`
          : 'Could not delete this invoice from IndexedDB.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* <p className="text-sm font-medium text-indigo-700">Invoices</p> */}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Invoices
          </h1>
          {/* <p className="mt-2 text-sm text-slate-500">
            View and search saved invoice records.
          </p> */}
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Create Invoice
        </Link>
      </div>

      {(editFeedback || feedback) && (
        <div
          role={feedbackError ? 'alert' : 'status'}
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            feedbackError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {feedback ?? editFeedback}
        </div>
      )}

      <section
        aria-label="Invoice records"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <Input
            label="Search invoices"
            type="search"
            placeholder="Search invoice number or customer"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Select
            label="Filter by customer"
            placeholder="All customers"
            options={customerOptions}
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.currentTarget.value)}
          />
          <Select
            label="Payment status"
            placeholder="All statuses"
            options={[
              { value: 'Paid', label: 'Paid' },
              { value: 'Unpaid', label: 'Unpaid' },
            ]}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
          />
          <Select
            label="Sort by"
            placeholder="Sort by"
            options={[
              { value: 'date-newest', label: 'Invoice date (newest)' },
              { value: 'date-oldest', label: 'Invoice date (oldest)' },
              { value: 'total-highest', label: 'Total (highest)' },
              { value: 'total-lowest', label: 'Total (lowest)' },
            ]}
            value={sort}
            onChange={(event) => {
              if (isInvoiceSort(event.currentTarget.value)) {
                setSort(event.currentTarget.value)
              }
            }}
          />
        </div>

        {isLoading ? (
          <div
            role="status"
            className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-600"
          >
            <Loader size="sm" label="Loading invoices" />
            Loading invoices…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"
          >
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(undefined)
                setIsLoading(true)
                setReloadKey((key) => key + 1)
              }}
            >
              Try again
            </Button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-slate-800">No invoices yet</p>
            <p className="text-sm text-slate-500">
              Create an invoice to see saved records here.
            </p>
          </div>
        ) : visibleInvoices.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-center text-sm text-slate-500">
            No invoices match the selected search and filters.
          </div>
        ) : (
          <Table
            columns={columns}
            data={visibleInvoices}
            getRowKey={(invoice) => invoice.id}
          />
        )}
      </section>
      <InvoiceDetailsModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onEdit={(invoice) => {
          setSelectedInvoiceId(null)
          navigate(`/invoices/${encodeURIComponent(invoice.id)}/edit`)
        }}
        onDelete={(invoice) => {
          setDeleteError(undefined)
          setSelectedInvoiceId(null)
          setInvoiceToDelete(invoice)
        }}
      />
      <Modal
        isOpen={invoiceToDelete !== null}
        title="Delete Invoice"
        onClose={() => {
          if (!isDeleting) {
            setInvoiceToDelete(null)
            setDeleteError(undefined)
          }
        }}
      >
        {invoiceToDelete && (
          <>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete invoice{' '}
              <span className="font-semibold text-slate-900">
                {invoiceToDelete.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setInvoiceToDelete(null)
                  setDeleteError(undefined)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={isDeleting}
                onClick={() => void confirmDelete()}
              >
                {isDeleting ? 'Deleting Invoice' : 'Delete Invoice'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default InvoiceListing
