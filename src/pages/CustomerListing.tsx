import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input, Loader, Modal, Table } from '../components/common'
import type { TableColumn } from '../components/common'
import CustomerDetailsModal from '../components/customer/CustomerDetailsModal'
import {
  deleteCustomer,
  getAllCustomers,
} from '../services/customerService'
import type { Customer } from '../types/customer'

type CustomerSort =
  | 'name-ascending'
  | 'name-descending'
  | 'created-newest'
  | 'created-oldest'

function isCustomerSort(value: string): value is CustomerSort {
  return [
    'name-ascending',
    'name-descending',
    'created-newest',
    'created-oldest',
  ].includes(value)
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function CustomerListing() {
  const location = useLocation()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()
  const [feedback, setFeedback] = useState<string>()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CustomerSort>('name-ascending')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [reloadKey, setReloadKey] = useState(0)
  const navigationState: unknown = location.state
  const editFeedback =
    typeof navigationState === 'object' &&
    navigationState !== null &&
    'customerFeedback' in navigationState &&
    typeof navigationState.customerFeedback === 'string'
      ? navigationState.customerFeedback
      : undefined

  useEffect(() => {
    let isMounted = true

    getAllCustomers()
      .then((loadedCustomers) => {
        if (isMounted) setCustomers(loadedCustomers)
      })
      .catch((loadError: unknown) => {
        if (!isMounted) return
        setError(
          loadError instanceof Error
            ? `Could not load customers from IndexedDB: ${loadError.message}`
            : 'Could not load customers from IndexedDB. Please try again.',
        )
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    )

    return filtered.sort((first, second) => {
      switch (sort) {
        case 'name-descending':
          return second.fullName.localeCompare(first.fullName)
        case 'created-newest':
          return (
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
          )
        case 'created-oldest':
          return (
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime()
          )
        case 'name-ascending':
        default:
          return first.fullName.localeCompare(second.fullName)
      }
    })
  }, [customers, search, sort])

  const columns: TableColumn<Customer>[] = [
    {
      id: 'name',
      header: 'Customer Name',
      renderCell: (customer) => (
        <span className="font-medium text-slate-900">{customer.fullName}</span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      renderCell: (customer) => (
        <a
          href={`mailto:${customer.email}`}
          className="text-indigo-700 hover:text-indigo-900 hover:underline"
        >
          {customer.email}
        </a>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      renderCell: (customer) => customer.phone || '—',
    },
    {
      id: 'city',
      header: 'City',
      renderCell: (customer) => customer.billingAddress.city,
    },
    {
      id: 'created',
      header: 'Created Date',
      renderCell: (customer) =>
        dateFormatter.format(new Date(customer.createdAt)),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      renderCell: (customer) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View ${customer.fullName}`}
            onClick={() => setSelectedCustomerId(customer.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ]

  async function confirmDelete() {
    if (!customerToDelete) return

    setIsDeleting(true)
    setDeleteError(undefined)

    try {
      await deleteCustomer(customerToDelete.id)
      setFeedback(`Customer ${customerToDelete.fullName} was deleted.`)
      setCustomerToDelete(null)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? `Could not delete customer: ${deleteFailure.message}`
          : 'Could not delete this customer from IndexedDB.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* <p className="text-sm font-medium text-indigo-700">Customers</p> */}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Customers
          </h1>
          {/* <p className="mt-2 text-sm text-slate-500">
            View and search saved customer records.
          </p> */}
        </div>
        <Link
          to="/customers/new"
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Add Customer
        </Link>
      </div>

      {editFeedback && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {editFeedback}
        </div>
      )}
      {feedback && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {feedback}
        </div>
      )}

      <section
        aria-label="Customer records"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input
            label="Search customers"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <label className="block text-sm font-medium text-slate-700">
            Sort by
            <select
              value={sort}
              onChange={(event) =>
                isCustomerSort(event.currentTarget.value) &&
                setSort(event.currentTarget.value)
              }
              className="mt-1.5 block min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-52"
            >
              <option value="name-ascending">Name (A to Z)</option>
              <option value="name-descending">Name (Z to A)</option>
              <option value="created-newest">Created date (newest)</option>
              <option value="created-oldest">Created date (oldest)</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div
            role="status"
            className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-600"
          >
            <Loader size="sm" label="Loading customers" />
            Loading customers…
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
        ) : customers.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-slate-800">No customers yet</p>
            <p className="text-sm text-slate-500">
              Create a customer to see their information here.
            </p>
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-center text-sm text-slate-500">
            No customers match your search.
          </div>
        ) : (
          <Table
            columns={columns}
            data={visibleCustomers}
            getRowKey={(customer) => customer.id}
          />
        )}
      </section>
      <CustomerDetailsModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onEdit={(customer) =>
          navigate(`/customers/${encodeURIComponent(customer.id)}/edit`)
        }
        onDelete={(customer) => {
          setDeleteError(undefined)
          setSelectedCustomerId(null)
          setCustomerToDelete(customer)
        }}
      />
      <Modal
        isOpen={customerToDelete !== null}
        title="Delete Customer"
        onClose={() => {
          if (!isDeleting) {
            setCustomerToDelete(null)
            setDeleteError(undefined)
          }
        }}
      >
        {customerToDelete && (
          <>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">
                {customerToDelete.fullName}
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
                  setCustomerToDelete(null)
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
                {isDeleting ? 'Deleting Customer' : 'Delete Customer'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default CustomerListing
