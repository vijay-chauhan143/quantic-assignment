import { useFormContext } from 'react-hook-form'
import { Card, Input } from '../common'
import type { CustomerFormValues } from '../../types/customer'

function PersonalInformationStep() {
  const {
    register,
    getFieldState,
    formState,
  } = useFormContext<CustomerFormValues>()

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the customer&apos;s contact details.
        </p>
      </div>

      <div className="grid gap-5">
        <Input
          {...register('fullName')}
          label="Full Name"
          placeholder="Enter full name"
          autoComplete="name"
          required
          error={getFieldState('fullName', formState).error?.message}
        />
        <Input
          {...register('email')}
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          required
          error={getFieldState('email', formState).error?.message}
        />
        <Input
          {...register('phone')}
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number"
          autoComplete="tel"
          error={getFieldState('phone', formState).error?.message}
        />
      </div>
    </Card>
  )
}

export default PersonalInformationStep
