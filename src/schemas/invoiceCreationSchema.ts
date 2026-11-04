import { z } from 'zod'

export const invoiceCreationSchema = z
  .object({
    customerId: z.string().min(1, 'Select a customer.'),
    invoiceDate: z.iso.date('Enter a valid invoice date.'),
    dueDate: z.iso.date('Enter a valid due date.'),
    items: z
      .array(
        z.object({
          description: z
            .string()
            .trim()
            .min(1, 'Item description is required.'),
          quantity: z
            .number({ error: 'Enter a quantity.' })
            .finite('Enter a valid quantity.')
            .gt(0, 'Quantity must be greater than zero.'),
          price: z
            .number({ error: 'Enter a unit price.' })
            .finite('Enter a valid unit price.')
            .gte(0, 'Price cannot be negative.'),
        }),
      )
      .min(1, 'Add at least one invoice item.'),
  })
  .refine(
    ({ invoiceDate, dueDate }) =>
      !invoiceDate || !dueDate || dueDate >= invoiceDate,
    {
      path: ['dueDate'],
      message: 'Due date cannot be earlier than invoice date.',
    },
  )

export type InvoiceCreationValues = z.infer<typeof invoiceCreationSchema>
