import { useFormContext } from 'react-hook-form'
import { Input } from '../common'
import type { CustomerFormValues } from '../../types/customer'

type AddressPrefix = 'billingAddress' | 'shippingAddress'
type AddressField =
  | `${AddressPrefix}.addressLine`
  | `${AddressPrefix}.city`
  | `${AddressPrefix}.state`
  | `${AddressPrefix}.postalCode`
  | `${AddressPrefix}.country`

interface CustomerAddressFieldsProps {
  prefix: AddressPrefix
  disabled?: boolean
}

const addressFields: {
  key: 'addressLine' | 'city' | 'state' | 'postalCode' | 'country'
  label: string
  autoComplete: string
}[] = [
  { key: 'addressLine', label: 'Address Line', autoComplete: 'address-line1' },
  { key: 'city', label: 'City', autoComplete: 'address-level2' },
  { key: 'state', label: 'State', autoComplete: 'address-level1' },
  { key: 'postalCode', label: 'Postal Code', autoComplete: 'postal-code' },
  { key: 'country', label: 'Country', autoComplete: 'country-name' },
]

function CustomerAddressFields({
  prefix,
  disabled = false,
}: CustomerAddressFieldsProps) {
  const {
    register,
    getFieldState,
    formState,
  } = useFormContext<CustomerFormValues>()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {addressFields.map(({ key, label, autoComplete }) => {
        const name = `${prefix}.${key}` as AddressField
        const error = getFieldState(name, formState).error?.message

        return (
          <div
            key={key}
            className={key === 'addressLine' ? 'sm:col-span-2' : undefined}
          >
            <Input
              {...register(name)}
              label={label}
              autoComplete={autoComplete}
              required
              disabled={disabled}
              error={error}
            />
          </div>
        )
      })}
    </div>
  )
}

export default CustomerAddressFields
