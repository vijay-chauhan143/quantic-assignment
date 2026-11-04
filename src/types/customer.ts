export interface CustomerAddress {
  addressLine: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CustomerFormValues {
  fullName: string
  email: string
  phone: string
  billingAddress: CustomerAddress
  shippingAddress: CustomerAddress
  shippingSameAsBilling: boolean
}

export interface Customer extends CustomerFormValues {
  id: string
  createdAt: string
  updatedAt: string
}

export type NewCustomer = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
