import localforage from 'localforage'
import { getCustomerById } from './customerService'
import type {
  Invoice,
  CreateInvoiceInput,
  InvoiceInput,
  InvoiceItem,
  InvoiceStatus,
} from '../types/invoice'

const invoiceStore = localforage.createInstance({
  name: 'quantic-application',
  storeName: 'invoices',
  description: 'Persisted invoice records',
  driver: localforage.INDEXEDDB,
})

export class InvoiceCustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer with ID ${customerId} was not found.`)
    this.name = 'InvoiceCustomerNotFoundError'
  }
}

export class InvoiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Invoice with ID ${id} was not found.`)
    this.name = 'InvoiceNotFoundError'
  }
}

export class DuplicateInvoiceNumberError extends Error {
  constructor(invoiceNumber: string) {
    super(`Invoice number ${invoiceNumber} is already in use.`)
    this.name = 'DuplicateInvoiceNumberError'
  }
}

export class InvalidInvoiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInvoiceError'
  }
}

async function ensureStoreReady(): Promise<void> {
  await invoiceStore.ready()
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function calculateInvoiceItemAmount(
  quantity: number,
  price: number,
): number {
  return roundCurrency(quantity * roundCurrency(price))
}

export function calculateInvoiceTotal(amounts: number[]): number {
  return roundCurrency(amounts.reduce((sum, amount) => sum + amount, 0))
}

function buildItems(
  items: InvoiceInput['items'],
): { items: InvoiceItem[]; subtotal: number } {
  if (!Array.isArray(items) || items.length === 0) {
    throw new InvalidInvoiceError('At least one invoice item is required.')
  }

  const calculatedItems = items.map((item) => {
    if (!item || typeof item.description !== 'string') {
      throw new InvalidInvoiceError('Invoice item descriptions are required.')
    }

    const description = item.description.trim()

    if (!description) {
      throw new InvalidInvoiceError('Invoice item descriptions are required.')
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new InvalidInvoiceError(
        'Invoice item quantities must be greater than zero.',
      )
    }

    if (!Number.isFinite(item.price) || item.price < 0) {
      throw new InvalidInvoiceError(
        'Invoice item prices must be zero or greater.',
      )
    }

    const amount = calculateInvoiceItemAmount(item.quantity, item.price)
    if (!Number.isFinite(amount)) {
      throw new InvalidInvoiceError('Invoice item amounts must be finite.')
    }

    return {
      id: crypto.randomUUID(),
      description,
      quantity: item.quantity,
      price: roundCurrency(item.price),
      amount,
    }
  })

  const subtotal = calculateInvoiceTotal(
    calculatedItems.map((item) => item.amount),
  )
  if (!Number.isFinite(subtotal)) {
    throw new InvalidInvoiceError('Invoice total must be finite.')
  }

  return {
    items: calculatedItems,
    subtotal,
  }
}

function validateDates(invoiceDate: string, dueDate: string): void {
  const isValidDate = (value: string) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`)
    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === value
    )
  }

  if (
    !isValidDate(invoiceDate) ||
    !isValidDate(dueDate)
  ) {
    throw new InvalidInvoiceError('Valid invoice and due dates are required.')
  }

  if (dueDate < invoiceDate) {
    throw new InvalidInvoiceError(
      'Due date cannot be earlier than invoice date.',
    )
  }
}

function validateStatus(status: InvoiceStatus | undefined): void {
  if (status !== undefined && status !== 'Paid' && status !== 'Unpaid') {
    throw new InvalidInvoiceError('Invoice status must be Paid or Unpaid.')
  }
}

async function ensureCustomerExists(customerId: string): Promise<void> {
  if (!(await getCustomerById(customerId))) {
    throw new InvoiceCustomerNotFoundError(customerId)
  }
}

export async function getAllInvoices(): Promise<Invoice[]> {
  await ensureStoreReady()
  const invoices: Invoice[] = []

  await invoiceStore.iterate<Invoice, void>((invoice) => {
    invoices.push(invoice)
  })

  return invoices.sort((first, second) =>
    second.invoiceDate.localeCompare(first.invoiceDate),
  )
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  await ensureStoreReady()
  return invoiceStore.getItem<Invoice>(id)
}

export async function getInvoicesByCustomerId(
  customerId: string,
): Promise<Invoice[]> {
  const invoices = await getAllInvoices()
  return invoices.filter((invoice) => invoice.customerId === customerId)
}

export async function generateInvoiceNumber(): Promise<string> {
  await ensureStoreReady()
  const invoices = await getAllInvoices()
  const existingNumbers = new Set(
    invoices.map((invoice) => invoice.invoiceNumber),
  )

  let invoiceNumber: string
  do {
    const dateStamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
    invoiceNumber = `INV-${dateStamp}-${crypto.randomUUID()}`
  } while (existingNumbers.has(invoiceNumber))

  return invoiceNumber
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<Invoice> {
  await ensureStoreReady()
  await ensureCustomerExists(input.customerId)
  validateDates(input.invoiceDate, input.dueDate)
  validateStatus(input.status)

  let id = crypto.randomUUID()
  while (await invoiceStore.getItem<Invoice>(id)) {
    id = crypto.randomUUID()
  }

  const { items, subtotal } = buildItems(input.items)
  const invoiceNumber =
    input.invoiceNumber?.trim() || (await generateInvoiceNumber())
  const existingInvoices = await getAllInvoices()
  if (
    existingInvoices.some(
      (invoice) => invoice.invoiceNumber === invoiceNumber,
    )
  ) {
    throw new DuplicateInvoiceNumberError(invoiceNumber)
  }
  const timestamp = new Date().toISOString()
  const invoice: Invoice = {
    id,
    customerId: input.customerId,
    invoiceNumber,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    items,
    subtotal,
    total: subtotal,
    status: input.status ?? 'Unpaid',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await invoiceStore.setItem(id, invoice)
  return invoice
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
): Promise<Invoice> {
  await ensureStoreReady()

  const existingInvoice = await invoiceStore.getItem<Invoice>(id)
  if (!existingInvoice) {
    throw new InvoiceNotFoundError(id)
  }

  await ensureCustomerExists(input.customerId)
  validateDates(input.invoiceDate, input.dueDate)
  validateStatus(input.status)
  const { items: calculatedItems, subtotal } = buildItems(input.items)
  const items = calculatedItems.map((item, index) => ({
    ...item,
    id: existingInvoice.items[index]?.id ?? item.id,
  }))

  const invoice: Invoice = {
    ...existingInvoice,
    customerId: input.customerId,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    items,
    subtotal,
    total: subtotal,
    status: input.status ?? existingInvoice.status,
    updatedAt: new Date().toISOString(),
  }

  await invoiceStore.setItem(id, invoice)
  return invoice
}

export async function deleteInvoice(id: string): Promise<void> {
  await ensureStoreReady()

  if (!(await invoiceStore.getItem<Invoice>(id))) {
    throw new InvoiceNotFoundError(id)
  }

  await invoiceStore.removeItem(id)
}
