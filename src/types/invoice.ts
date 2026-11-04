export type InvoiceStatus = 'Paid' | 'Unpaid'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  amount: number
}

export interface InvoiceItemInput {
  description: string
  quantity: number
  price: number
}

export interface Invoice {
  id: string
  customerId: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  total: number
  status: InvoiceStatus
  createdAt: string
  updatedAt: string
}

export interface InvoiceInput {
  customerId: string
  invoiceDate: string
  dueDate: string
  items: InvoiceItemInput[]
  status?: InvoiceStatus
}

export interface CreateInvoiceInput extends InvoiceInput {
  invoiceNumber?: string
}
