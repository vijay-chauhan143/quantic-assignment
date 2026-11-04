import { useEffect, useState } from 'react'
import { Button, Card, Loader, Modal } from '../common'
import { getCustomerById } from '../../services/customerService'
import type { Customer, CustomerAddress } from '../../types/customer'

interface CustomerDetailsModalProps {
  customerId: string | null
  onClose: () => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

type CustomerDetailsState =
  | { status: 'found'; customerId: string; customer: Customer }
  | { status: 'not-found'; customerId: string }
  | { status: 'error'; customerId: string; message: string }

const addressFields: { key: keyof CustomerAddress; label: string }[] = [
  { key: 'addressLine', label: 'Address Line' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
]

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString()
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-slate-800">
        {value || '—'}
      </dd>
    </div>
  )
}

function AddressDetails({
  title,
  address,
}: {
  title: string
  address: CustomerAddress
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {addressFields.map(({ key, label }) => (
          <Detail key={key} label={label} value={address[key]} />
        ))}
      </dl>
    </section>
  )
}

function CustomerDetailsModal({
  customerId,
  onClose,
  onEdit,
  onDelete,
}: CustomerDetailsModalProps) {
  const [details, setDetails] = useState<CustomerDetailsState>()

  useEffect(() => {
    if (!customerId) return

    let isCurrentRequest = true

    getCustomerById(customerId)
      .then((customer) => {
        if (!isCurrentRequest) return
        setDetails(
          customer
            ? { status: 'found', customerId, customer }
            : { status: 'not-found', customerId },
        )
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return
        setDetails({
          status: 'error',
          customerId,
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.',
        })
      })

    return () => {
      isCurrentRequest = false
    }
  }, [customerId])

  const isOpen = customerId !== null
  const currentDetails =
    details?.customerId === customerId ? details : undefined

  return (
    <Modal
      isOpen={isOpen}
      title="Customer Details"
      onClose={onClose}
      className="max-w-2xl"
    >
      {!currentDetails ? (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-600"
        >
          <Loader label="Loading customer details" />
          Loading customer details…
        </div>
      ) : currentDetails.status === 'not-found' ? (
        <div role="alert" className="py-8 text-center">
          <p className="font-medium text-slate-900">Customer not found</p>
          <p className="mt-2 text-sm text-slate-600">
            This customer may have been removed from IndexedDB.
          </p>
        </div>
      ) : currentDetails.status === 'error' ? (
        <div role="alert" className="py-8 text-center">
          <p className="font-medium text-red-700">
            Could not load customer details.
          </p>
          <p className="mt-2 break-words text-sm text-slate-600">
            {currentDetails.message}
          </p>
        </div>
      ) : (
        <CustomerDetails customer={currentDetails.customer} />
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
        {currentDetails?.status === 'found' ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              onClick={() => onDelete(currentDetails.customer)}
            >
              Delete Customer
            </Button>
            <Button
              variant="primary"
              onClick={() => onEdit(currentDetails.customer)}
            >
              Edit Customer
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

function CustomerDetails({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-none">
        <section>
          <h3 className="text-sm font-semibold text-slate-900">
            Personal Information
          </h3>
          <dl className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Detail label="Name" value={customer.fullName} />
            <Detail label="Email" value={customer.email} />
            <Detail label="Phone" value={customer.phone || 'Not provided'} />
          </dl>
        </section>
      </Card>

      <Card className="p-4 shadow-none">
        <AddressDetails title="Billing Address" address={customer.billingAddress} />
      </Card>

      <Card className="p-4 shadow-none">
        <AddressDetails
          title="Shipping Address"
          address={customer.shippingAddress}
        />
      </Card>

      <Card className="p-4 shadow-none">
        <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Detail label="Created Date" value={formatDate(customer.createdAt)} />
          {customer.updatedAt && (
            <Detail
              label="Updated Date"
              value={formatDate(customer.updatedAt)}
            />
          )}
        </dl>
      </Card>
    </div>
  )
}

export default CustomerDetailsModal
