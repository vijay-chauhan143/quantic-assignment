# Quantic Customer and Invoice Manager

A React dashboard for managing customer records and invoices. Customer and invoice data is stored locally in the browser with IndexedDB through LocalForage; the application does not use a backend API.

## Features

- Responsive dashboard layout with Home, Customers, Create Customer, and Invoices navigation.
- Three-step customer creation flow with Zod validation, billing and shipping addresses, and a same-as-billing option.
- Customer listing with search, sorting, details, editing, and deletion. Deletion is blocked while invoices reference the customer.
- Invoice creation for an existing customer with multiple line items and automatically calculated amounts and totals.
- Invoice listing with search, customer and payment-status filters, and sorting by invoice date or total.
- Invoice detail view, editing, deletion with confirmation, and manual Paid/Unpaid status updates.

## Technologies

- React 19
- TypeScript 7
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- React Hook Form and Zod
- LocalForage with IndexedDB
- Oxlint

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (required by the installed Vite version)
- npm

## Installation

Install the project dependencies from the repository root:

```sh
npm ci
```

## Development

Start the Vite development server:

```sh
npm run dev
```

Vite prints the local URL when the server is ready.

## Production build and lint

Run the TypeScript project checks and create a production build in `dist/`:

```sh
npm run build
```

Run Oxlint:

```sh
npm run lint
```

To serve the production build locally:

```sh
npm run preview
```

## Routes

| Route | Screen |
|---|---|
| `/` | Home |
| `/customers` | Customer listing |
| `/customers/new` | Create customer |
| `/customers/:customerId/edit` | Edit customer |
| `/invoices` | Invoice listing |
| `/invoices/new` | Create invoice |
| `/invoices/:invoiceId/edit` | Edit invoice |

## Customer and invoice modules

Customer records include personal information and billing and shipping addresses. The three-step form validates required data and conditionally validates shipping details when the shipping address differs from billing. Customer email duplicates are checked case-insensitively when saving or updating.

Invoices require an existing customer and valid dates and line items. The invoice service validates input and calculates line amounts, subtotal, and total before saving. Payment status can be changed manually between Paid and Unpaid; no payment processing is integrated.

## Browser storage

LocalForage stores records in the browser's IndexedDB database named `quantic-application`, using separate `customers` and `invoices` object stores. Data is local to the browser profile and application origin; it is not synchronized to a server or shared across devices. Clearing the browser's site data removes the stored records.
