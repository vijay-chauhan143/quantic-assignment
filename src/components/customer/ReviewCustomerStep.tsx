import { useFormContext } from 'react-hook-form'
import { Card } from '../common'
import type { CustomerAddress, CustomerFormValues } from '../../types/customer'

const addressLabels: { key: keyof CustomerAddress; label: string }[] = [
  { key: 'addressLine', label: 'Address Line' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
]

interface AddressSummaryProps {
  title: string
  address: CustomerAddress
}

function AddressSummary({ title, address }: AddressSummaryProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {addressLabels.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm text-slate-800">
              {address[key] || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ReviewCustomerStep() {
  const { getValues } = useFormContext<CustomerFormValues>()
  const customer = getValues()

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Review Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review the information before saving the customer.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-800">
            Personal Information
          </h3>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Full Name
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {customer.fullName || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email Address
              </dt>
              <dd className="mt-1 break-words text-sm text-slate-800">
                {customer.email || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone Number
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {customer.phone || 'Not provided'}
              </dd>
            </div>
          </dl>
        </section>

        <div className="border-t border-slate-200" />

        <AddressSummary
          title="Billing Address"
          address={customer.billingAddress}
        />

        <div className="border-t border-slate-200" />

        <div>
          {customer.shippingSameAsBilling && (
            <p className="mb-3 text-xs font-medium text-indigo-700">
              Same as billing address
            </p>
          )}
          <AddressSummary
            title="Shipping Address"
            address={customer.shippingAddress}
          />
        </div>
      </div>
    </Card>
  )
}

export default ReviewCustomerStep
