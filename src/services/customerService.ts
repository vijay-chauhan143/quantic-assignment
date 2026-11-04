import localforage from 'localforage'
import { getInvoicesByCustomerId } from './invoiceService'
import type { Customer, NewCustomer } from '../types/customer'

const customerStore = localforage.createInstance({
  name: 'quantic-application',
  storeName: 'customers',
  description: 'Persisted customer records',
  driver: localforage.INDEXEDDB,
})

export class DuplicateCustomerEmailError extends Error {
  constructor(email: string) {
    super(`A customer with the email address ${email} already exists.`)
    this.name = 'DuplicateCustomerEmailError'
  }
}

export class CustomerHasInvoicesError extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} has associated invoices and cannot be deleted.`)
    this.name = 'CustomerHasInvoicesError'
  }
}

async function ensureStoreReady(): Promise<void> {
  await customerStore.ready()
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function getAllCustomers(): Promise<Customer[]> {
  await ensureStoreReady()
  const customers: Customer[] = []

  await customerStore.iterate<Customer, void>((customer) => {
    customers.push(customer)
  })

  return customers.sort((first, second) =>
    first.fullName.localeCompare(second.fullName),
  )
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  await ensureStoreReady()
  return customerStore.getItem<Customer>(id)
}

export async function hasDuplicateCustomerEmail(
  email: string,
  excludedCustomerId?: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email)
  const customers = await getAllCustomers()

  return customers.some(
    (customer) =>
      customer.id !== excludedCustomerId &&
      normalizeEmail(customer.email) === normalizedEmail,
  )
}

export async function saveCustomer(
  customerData: NewCustomer,
): Promise<Customer> {
  await ensureStoreReady()

  if (await hasDuplicateCustomerEmail(customerData.email)) {
    throw new DuplicateCustomerEmailError(customerData.email)
  }

  let id = crypto.randomUUID()
  while (await customerStore.getItem<Customer>(id)) {
    id = crypto.randomUUID()
  }

  const timestamp = new Date().toISOString()
  const customer: Customer = {
    ...customerData,
    email: customerData.email.trim(),
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await customerStore.setItem(id, customer)
  return customer
}

export async function updateCustomer(
  id: string,
  customerData: NewCustomer,
): Promise<Customer> {
  await ensureStoreReady()

  const existingCustomer = await customerStore.getItem<Customer>(id)
  if (!existingCustomer) {
    throw new Error(`Customer with ID ${id} was not found.`)
  }

  if (await hasDuplicateCustomerEmail(customerData.email, id)) {
    throw new DuplicateCustomerEmailError(customerData.email)
  }

  const customer: Customer = {
    ...customerData,
    email: customerData.email.trim(),
    id,
    createdAt: existingCustomer.createdAt,
    updatedAt: new Date().toISOString(),
  }

  await customerStore.setItem(id, customer)
  return customer
}

export async function deleteCustomer(id: string): Promise<void> {
  await ensureStoreReady()

  if (!(await customerStore.getItem<Customer>(id))) {
    throw new Error(`Customer with ID ${id} was not found.`)
  }

  if ((await getInvoicesByCustomerId(id)).length > 0) {
    throw new CustomerHasInvoicesError(id)
  }

  await customerStore.removeItem(id)
}
