import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import CustomerCreation from '../pages/CustomerCreation'
import CustomerListing from '../pages/CustomerListing'
import Home from '../pages/Home'
import InvoiceCreation from '../pages/InvoiceCreation'
import InvoiceListing from '../pages/InvoiceListing'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<CustomerListing />} />
          <Route path="/customers/new" element={<CustomerCreation />} />
          <Route
            path="/customers/:customerId/edit"
            element={<CustomerCreation />}
          />
          <Route path="/invoices" element={<InvoiceListing />} />
          <Route
            path="/invoices/:invoiceId/edit"
            element={<InvoiceCreation />}
          />
          <Route path="/invoices/new" element={<InvoiceCreation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
