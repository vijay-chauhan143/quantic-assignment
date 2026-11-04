import { useFormContext } from 'react-hook-form'
import { Card, Checkbox } from '../common'
import CustomerAddressFields from './CustomerAddressFields'
import type { CustomerFormValues } from '../../types/customer'

function AddressInformationStep() {
  const { register, watch } = useFormContext<CustomerFormValues>()
  const shippingSameAsBilling = watch('shippingSameAsBilling')

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Billing Address
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add the customer&apos;s billing address.
          </p>
        </div>
        <CustomerAddressFields prefix="billingAddress" />
      </Card>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Shipping Address
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter a separate shipping address, or use the billing address.
          </p>
        </div>

        <Checkbox
          {...register('shippingSameAsBilling')}
          checked={shippingSameAsBilling}
          label="Shipping address same as billing address"
          className="mb-5"
        />

        <CustomerAddressFields
          prefix="shippingAddress"
          disabled={shippingSameAsBilling}
        />
      </Card>
    </div>
  )
}

export default AddressInformationStep
