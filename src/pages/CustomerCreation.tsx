import { useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldPath, SubmitHandler } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common'
import AddressInformationStep from '../components/customer/AddressInformationStep'
import PersonalInformationStep from '../components/customer/PersonalInformationStep'
import ReviewCustomerStep from '../components/customer/ReviewCustomerStep'
import { customerSchema } from '../schemas/customerSchema'
import {
  DuplicateCustomerEmailError,
  saveCustomer as persistCustomer,
  updateCustomer as persistCustomerUpdate,
  getCustomerById,
} from '../services/customerService'
import type { CustomerFormValues } from '../types/customer'

const steps = [
  'Personal Information',
  'Address Information',
  'Review Information',
] as const

const personalFields: FieldPath<CustomerFormValues>[] = [
  'fullName',
  'email',
  'phone',
]

const billingFields: FieldPath<CustomerFormValues>[] = [
  'billingAddress.addressLine',
  'billingAddress.city',
  'billingAddress.state',
  'billingAddress.postalCode',
  'billingAddress.country',
]

const shippingFields: FieldPath<CustomerFormValues>[] = [
  'shippingAddress.addressLine',
  'shippingAddress.city',
  'shippingAddress.state',
  'shippingAddress.postalCode',
  'shippingAddress.country',
]

const emptyAddress = {
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
}

const defaultValues: CustomerFormValues = {
  fullName: '',
  email: '',
  phone: '',
  billingAddress: { ...emptyAddress },
  shippingAddress: { ...emptyAddress },
  shippingSameAsBilling: false,
}

function CustomerCreation() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(customerId)
  const [currentStep, setCurrentStep] = useState(0)
  const [loadedCustomerId, setLoadedCustomerId] = useState<string | null>(null)
  const [loadFailure, setLoadFailure] = useState<{
    customerId: string
    message: string
  }>()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  }>()
  const methods = useForm<CustomerFormValues>({
    defaultValues,
    resolver: zodResolver(customerSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { isSubmitting },
  } = methods
  const shippingSameAsBilling = useWatch({
    control,
    name: 'shippingSameAsBilling',
  })
  const billingAddressLine = useWatch({
    control,
    name: 'billingAddress.addressLine',
  })
  const billingCity = useWatch({ control, name: 'billingAddress.city' })
  const billingState = useWatch({ control, name: 'billingAddress.state' })
  const billingPostalCode = useWatch({
    control,
    name: 'billingAddress.postalCode',
  })
  const billingCountry = useWatch({ control, name: 'billingAddress.country' })

  useEffect(() => {
    if (!customerId) return

    let isCurrentRequest = true

    getCustomerById(customerId)
      .then((customer) => {
        if (!isCurrentRequest) return
        if (!customer) {
          setLoadFailure({
            customerId,
            message: 'This customer could not be found.',
          })
          return
        }

        reset({
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          billingAddress: { ...customer.billingAddress },
          shippingAddress: { ...customer.shippingAddress },
          shippingSameAsBilling: customer.shippingSameAsBilling,
        })
        setLoadedCustomerId(customerId)
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return
        setLoadFailure({
          customerId,
          message:
            error instanceof Error
              ? `Could not load this customer: ${error.message}`
              : 'Could not load this customer from IndexedDB.',
        })
      })

    return () => {
      isCurrentRequest = false
    }
  }, [customerId, reset])

  const isLoadingCustomer = Boolean(
    customerId &&
      loadedCustomerId !== customerId &&
      loadFailure?.customerId !== customerId,
  )
  const loadError =
    loadFailure && loadFailure.customerId === customerId
      ? loadFailure.message
      : undefined

  useEffect(() => {
    if (!shippingSameAsBilling) return

    setValue('shippingAddress.addressLine', billingAddressLine, {
      shouldDirty: true,
    })
    setValue('shippingAddress.city', billingCity, { shouldDirty: true })
    setValue('shippingAddress.state', billingState, { shouldDirty: true })
    setValue('shippingAddress.postalCode', billingPostalCode, {
      shouldDirty: true,
    })
    setValue('shippingAddress.country', billingCountry, { shouldDirty: true })
  }, [
    billingAddressLine,
    billingCity,
    billingState,
    billingPostalCode,
    billingCountry,
    setValue,
    shippingSameAsBilling,
  ])

  async function goToNextStep() {
    const fields =
      currentStep === 0
        ? personalFields
        : [
            ...billingFields,
            ...(getValues('shippingSameAsBilling') ? [] : shippingFields),
          ]

    if (await trigger(fields, { shouldFocus: true })) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
    }
  }

  function goToPreviousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const saveCustomer: SubmitHandler<CustomerFormValues> = async (customer) => {
    setFeedback(undefined)

    try {
      if (customerId) {
        const updatedCustomer = await persistCustomerUpdate(customerId, customer)
        navigate('/customers', {
          state: {
            customerFeedback: `Customer ${updatedCustomer.fullName} was updated successfully.`,
          },
        })
      } else {
        const savedCustomer = await persistCustomer(customer)
        setFeedback({
          type: 'success',
          message: `Customer ${savedCustomer.fullName} was saved successfully.`,
        })
        reset(defaultValues)
        setCurrentStep(0)
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof DuplicateCustomerEmailError
            ? error.message
            : `Could not ${isEditMode ? 'update' : 'save'} the customer in IndexedDB. Please try again.`,
      })
    }
  }

  const stepContent = [
    <PersonalInformationStep key="personal" />,
    <AddressInformationStep key="address" />,
    <ReviewCustomerStep key="review" />,
  ]

  if (isLoadingCustomer) {
    return (
      <div role="status" className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-slate-600">Loading customer details…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {loadError}
        </div>
        <Link
          to="/customers"
          className="mt-4 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        {/* <p className="text-sm font-medium text-indigo-700">Customers</p> */}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {isEditMode ? 'Edit Customer' : 'Create Customer'}
        </h1>
        {/* <p className="mt-2 text-sm text-slate-500">
          {isEditMode
            ? 'Update customer details in a few simple steps.'
            : 'Add customer details in a few simple steps.'}
        </p> */}
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <ol
        aria-label="Customer creation progress"
        className="mb-6 grid grid-cols-3 gap-2"
      >
        {steps.map((step, index) => {
          const isCurrent = currentStep === index
          const isComplete = currentStep > index

          return (
            <li
              key={step}
              aria-current={isCurrent ? 'step' : undefined}
              className="min-w-0"
            >
              <div
                className={`mb-2 h-1 rounded-full ${
                  isComplete || isCurrent ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
              <p
                className={`truncate text-xs font-medium sm:text-sm ${
                  isCurrent || isComplete ? 'text-indigo-700' : 'text-slate-500'
                }`}
              >
                <span className="mr-1">{index + 1}.</span>
                {step}
              </p>
            </li>
          )
        })}
      </ol>

      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={handleSubmit(saveCustomer)}
          className="space-y-5"
        >
          {stepContent[currentStep]}

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                key="next"
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  void goToNextStep()
                }}
              >
                Next
              </Button>
            ) : (
              <Button key="save" type="submit" loading={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? 'Updating Customer'
                    : 'Saving Customer'
                  : isEditMode
                    ? 'Update Customer'
                    : 'Save Customer'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export default CustomerCreation
