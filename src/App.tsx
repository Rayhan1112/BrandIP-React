 import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ShopLayout, Homepage, BrandingOrder, BrandingOrderStepView, Patent, Startup, ProfileLayout, SubmitDomain, DomainDetails, Signup, Signin, Checkout } from './shop'
import {
  AdminAuthProvider,
  useAdminAuth,
  AdminLogin,
  AdminLayout,
  AdminDashboard,
  AdminPlaceholder,
} from './admin'
import { AuthProvider, useAuth } from './context/AuthContext'
import {
  ProfileTab,
  AddressTab,
  CartTab,
  MyDomainsTab,
  OffersTab,
  TerminationsTab,
  PaymentTab,
  OrdersTab,
  InvoiceView,
} from './shop/profile/tabs'
import { DomainRequests, PaymentVerifications } from './admin/components'
import { PhpProducts } from './components/PhpProducts'
import { AdminProducts, AdminAttributes, AdminCategories, AdminAttributeFamilies } from './admin/catalog'
import { OrdersList, OrderDetail, AdminTransactionsList } from './admin/sales'

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/admin" replace />
  return <>{children}</>
}

function UserProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin: single Route tree so /admin and /admin/* match correctly */}
          <Route path="/admin" element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
            <Route index element={<AdminLogin />} />
            <Route
              path="dashboard"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminDashboard />} />
            </Route>
            <Route
              path="domain-requests"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<DomainRequests />} />
            </Route>
            <Route
              path="catalog/products"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminProducts />} />
            </Route>
            <Route
              path="catalog/attributes"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminAttributes />} />
            </Route>
            <Route
              path="catalog/categories"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminCategories />} />
            </Route>
            <Route
              path="catalog/attribute-families"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminAttributeFamilies />} />
            </Route>
            <Route
              path="payment-verifications"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<PaymentVerifications />} />
            </Route>
            <Route
              path="sales/orders"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<OrdersList />} />
              <Route path=":orderId" element={<OrderDetail />} />
            </Route>
            <Route
              path="sales/transactions"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminTransactionsList />} />
            </Route>
            <Route
              path=":other"
              element={
                <AdminProtected>
                  <AdminLayout />
                </AdminProtected>
              }
            >
              <Route index element={<AdminPlaceholder />} />
            </Route>
          </Route>
          
          {/* User authentication routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          
          {/* Profile routes - protected */}
          <Route
            path="/profile"
            element={
              <UserProtected>
                <ShopLayout />
              </UserProtected>
            }
          >
            <Route element={<ProfileLayout />}>
              <Route index element={<ProfileTab />} />
              <Route path="address" element={<AddressTab />} />
              <Route path="cart" element={<CartTab />} />
              <Route path="orders" element={<OrdersTab />} />
              <Route path="invoices/:orderId" element={<InvoiceView />} />
              <Route path="my-domains" element={<MyDomainsTab />} />
              <Route path="offers" element={<OffersTab />} />
              <Route path="terminations" element={<TerminationsTab />} />
              <Route path="payment" element={<PaymentTab />} />
            </Route>
          </Route>
          
          {/* Shop routes with fixed header/footer layout */}
          <Route element={<ShopLayout />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/cart" element={<CartTab />} />
            <Route path="/domain/:id" element={<DomainDetails />} />
            <Route path="/branding" element={<BrandingOrder />} />
            <Route path="/branding/order" element={<Navigate to="/branding/order/1" replace />} />
            <Route path="/branding/order/:step" element={<BrandingOrderStepView />} />
            <Route path="/patent" element={<Patent />} />
            <Route path="/startup" element={<Startup />} />
            <Route path="/submit-domain" element={<SubmitDomain />} />
            <Route path="/php-products" element={<PhpProducts />} />
          </Route>
          
          {/* Checkout route - protected */}
          <Route
            path="/checkout"
            element={
              <UserProtected>
                <ShopLayout />
              </UserProtected>
            }
          >
            <Route index element={<Checkout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
