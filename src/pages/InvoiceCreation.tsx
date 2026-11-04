import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, Loader } from '../components/common'
import { invoiceCreationSchema } from '../schemas/invoiceCreationSchema'
import type { InvoiceCreationValues } from '../schemas/invoiceCreationSchema'
import { getAllCustomers } from '../services/customerService'
import {
  calculateInvoiceItemAmount,
  calculateInvoiceTotal,
  createInvoice,
  generateInvoiceNumber,
  getInvoiceById,
  updateInvoice,
} from '../services/invoiceService'
import type { Customer } from '../types/customer'
import type { Invoice } from '../types/invoice'

interface InvoiceFeedback {
  type: 'success' | 'error'
  message: string
}

const today = new Date().toISOString().slice(0, 10)

const defaultValues: InvoiceCreationValues = {
  customerId: '',
  invoiceDate: today,
  dueDate: today,
  items: [{ description: '', quantity: 1, price: 0 }],
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(amount) ? amount : 0)
}

function InvoiceCreation() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(invoiceId)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [customersError, setCustomersError] = useState<string>()
  const [editLoadError, setEditLoadError] = useState<string>()
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false)
  const [feedback, setFeedback] = useState<InvoiceFeedback>()
  const [createdInvoice, setCreatedInvoice] = useState<Invoice>()

  const {
    control,
    register,
    setValue,
    getFieldState,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceCreationValues>({
    defaultValues,
    resolver: zodResolver(invoiceCreationSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selectedCustomerId = useWatch({ control, name: 'customerId' })
  const items = useWatch({ control, name: 'items' })
  const invoiceDate = useWatch({ control, name: 'invoiceDate' })
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  )

  useEffect(() => {
    let isCurrentRequest = true

    Promise.all([
      getAllCustomers(),
      invoiceId ? getInvoiceById(invoiceId) : Promise.resolve(null),
      invoiceId ? Promise.resolve('') : generateInvoiceNumber(),
    ])
      .then(([loadedCustomers, invoice, generatedInvoiceNumber]) => {
        if (!isCurrentRequest) return
        setCustomers(loadedCustomers)
        if (invoiceId && !invoice) {
          setEditLoadError('This invoice could not be found in IndexedDB.')
          return
        }
        if (invoice) {
          setInvoiceNumber(invoice.invoiceNumber)
          reset({
            customerId: invoice.customerId,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            items: invoice.items.map(({ description, quantity, price }) => ({
              description,
              quantity,
              price,
            })),
          })
        } else {
          setInvoiceNumber(generatedInvoiceNumber)
        }
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return
        setCustomersError(
          error instanceof Error
            ? `Could not load customers: ${error.message}`
            : 'Could not load customers from IndexedDB.',
        )
      })
      .finally(() => {
        if (isCurrentRequest) setCustomersLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [invoiceId, reset])

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) return customers

    return customers.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    )
  }, [customerSearch, customers])

  const subtotal = useMemo(
    () =>
      calculateInvoiceTotal(
        (items ?? []).map((item) => {
          const quantity = Number(item?.quantity)
          const price = Number(item?.price)
          return Number.isFinite(quantity) &&
            quantity > 0 &&
            Number.isFinite(price) &&
            price >= 0
            ? calculateInvoiceItemAmount(quantity, price)
            : 0
        }),
      ),
    [items],
  )

  const submitInvoice: SubmitHandler<InvoiceCreationValues> = async (values) => {
    setFeedback(undefined)

    try {
      if (invoiceId) {
        const updatedInvoice = await updateInvoice(invoiceId, values)
        navigate('/invoices', {
          state: {
            invoiceFeedback: `Invoice ${updatedInvoice.invoiceNumber} was updated successfully.`,
          },
        })
        return
      }

      const nextInvoiceNumber = await generateInvoiceNumber()
      const invoice = await createInvoice({
        ...values,
        invoiceNumber,
      })
      setCreatedInvoice(invoice)
      setInvoiceNumber(nextInvoiceNumber)
      setFeedback({
        type: 'success',
        message: `Invoice ${invoice.invoiceNumber} was created successfully.`,
      })
      reset(defaultValues)
      setCustomerSearch('')
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? `Could not create invoice: ${error.message}`
            : 'Could not create the invoice. Please try again.',
      })
    }
  }

  if (customersLoading) {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-3xl items-center justify-center gap-3 py-20 text-sm text-slate-600"
      >
        <Loader label={isEditMode ? 'Loading invoice' : 'Loading customers'} />
        {isEditMode ? 'Loading invoice…' : 'Loading customers…'}
      </div>
    )
  }

  if (editLoadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {editLoadError}
        </div>
        <Link
          to="/invoices"
          className="mt-4 inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Invoices
        </Link>
      </div>
    )
  }

  if (customersError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {customersError}
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (customers.length === 0 && !isEditMode) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="py-12 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Create an Invoice
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create a customer before you create an invoice.
          </p>
          <Link
            to="/customers/new"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Customer
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        {/* <p className="text-sm font-medium text-indigo-700">Invoices</p> */}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        {/* <p className="mt-2 text-sm text-slate-500">
          {isEditMode
            ? 'Update the customer, dates, or invoice items.'
            : 'Select a customer and add one or more invoice items.'}
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
          {feedback.type === 'success' && createdInvoice && (
            <p className="mt-1">
              Total: {formatCurrency(createdInvoice.total)} · Status:{' '}
              {createdInvoice.status}
            </p>
          )}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(submitInvoice)}
        className="space-y-5"
      >
        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Invoice Details
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <Input
                label="Customer"
                placeholder="Search by customer name or email"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isCustomerMenuOpen}
                aria-controls="invoice-customer-options"
                autoComplete="off"
                value={
                  selectedCustomer && !isCustomerMenuOpen
                    ? `${selectedCustomer.fullName} · ${selectedCustomer.email}`
                    : customerSearch
                }
                onFocus={() => setIsCustomerMenuOpen(true)}
                onChange={(event) => {
                  setCustomerSearch(event.currentTarget.value)
                  setIsCustomerMenuOpen(true)
                  setValue('customerId', '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
                error={errors.customerId?.message}
                required
              />
              {isCustomerMenuOpen && (
                <ul
                  id="invoice-customer-options"
                  role="listbox"
                  aria-label="Customers"
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
                >
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                          <li
                            key={customer.id}
                            role="option"
                            aria-selected={customer.id === selectedCustomerId}
                          >
                        <button
                          type="button"
                          className="flex w-full flex-col rounded px-3 py-2 text-left hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                          onClick={() => {
                            setValue('customerId', customer.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            setCustomerSearch(
                              `${customer.fullName} · ${customer.email}`,
                            )
                            setIsCustomerMenuOpen(false)
                          }}
                        >
                          <span className="text-sm font-medium text-slate-900">
                            {customer.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {customer.email}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-slate-500">
                      No matching customers.
                    </li>
                  )}
                </ul>
              )}
              {selectedCustomer && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {selectedCustomer.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="invoice-number"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Invoice Number
              </label>
              <input
                id="invoice-number"
                readOnly
                value={invoiceNumber}
                className="block min-h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-500"
              />
            </div>
            <Input
              {...register('invoiceDate')}
              label="Invoice Date"
              type="date"
              required
              error={errors.invoiceDate?.message}
            />
            <Input
              {...register('dueDate')}
              label="Due Date"
              type="date"
              min={invoiceDate}
              required
              error={errors.dueDate?.message}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Invoice Items
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Line amounts and totals update as you edit.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: '', quantity: 1, price: 0 })
              }
            >
              Add Item
            </Button>
          </div>

          {errors.items?.root?.message && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {errors.items.root.message}
            </p>
          )}
          {typeof errors.items?.message === 'string' && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {errors.items.message}
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => {
              const descriptionPath = `items.${index}.description` as const
              const quantityPath = `items.${index}.quantity` as const
              const pricePath = `items.${index}.price` as const
              const item = items?.[index]
              const quantity = Number(item?.quantity)
              const price = Number(item?.price)
              const amount =
                Number.isFinite(quantity) &&
                quantity > 0 &&
                Number.isFinite(price) &&
                price >= 0
                  ? calculateInvoiceItemAmount(quantity, price)
                  : 0

              return (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(6rem,1fr)_minmax(7rem,1fr)_auto] sm:items-end"
                >
                  <Input
                    {...register(descriptionPath)}
                    label={`Item ${index + 1} Description`}
                    placeholder="Description"
                    required
                    error={getFieldState(descriptionPath).error?.message}
                  />
                  <Input
                    {...register(quantityPath, { valueAsNumber: true })}
                    label="Quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    error={getFieldState(quantityPath).error?.message}
                  />
                  <Input
                    {...register(pricePath, { valueAsNumber: true })}
                    label="Unit Price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    error={getFieldState(pricePath).error?.message}
                  />
                  <div className="flex items-center justify-between gap-3 sm:block sm:pb-2">
                    <span className="text-sm text-slate-500 sm:hidden">
                      Amount
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove item ${index + 1}`}
                      disabled={fields.length === 1}
                      className="ml-3 text-red-700 hover:bg-red-50"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
            <dl className="grid min-w-48 grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <dt className="font-medium text-slate-600">Subtotal</dt>
              <dd className="text-right font-medium text-slate-900">
                {formatCurrency(subtotal)}
              </dd>
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatCurrency(subtotal)}
              </dd>
            </dl>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? 'Saving Changes'
                : 'Saving Invoice'
              : isEditMode
                ? 'Save Changes'
                : 'Save Invoice'}
          </Button>
        </div>
      </form>

    </div>
  )
}

export default InvoiceCreation
