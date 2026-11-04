import { z } from 'zod'

const addressFields = [
  'addressLine',
  'city',
  'state',
  'postalCode',
  'country',
] as const

const addressSchema = z.object({
  addressLine: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  postalCode: z.string().trim(),
  country: z.string().trim(),
})

export const customerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required.')
      .email('Enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => {
          if (!value) return true
          const digitCount = value.replace(/\D/g, '').length
          return /^\+?[0-9\s().-]+$/.test(value) && digitCount >= 7 && digitCount <= 15
        },
        'Enter a valid phone number.',
      ),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    shippingSameAsBilling: z.boolean(),
  })
  .superRefine((customer, context) => {
    for (const field of addressFields) {
      if (!customer.billingAddress[field]) {
        context.addIssue({
          code: 'custom',
          path: ['billingAddress', field],
          message: 'This field is required.',
        })
      }

      if (!customer.shippingSameAsBilling && !customer.shippingAddress[field]) {
        context.addIssue({
          code: 'custom',
          path: ['shippingAddress', field],
          message: 'This field is required.',
        })
      }
    }
  })
