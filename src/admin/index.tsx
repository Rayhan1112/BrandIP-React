import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminPlaceholder } from './AdminPlaceholder';

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export function AdminRoutes() {
  return (
    <Routes>
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
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export { AdminLogin, AdminLayout, AdminDashboard, AdminPlaceholder, AdminAuthProvider, useAdminAuth };
export { AdminLogo, AdminCard, AdminFormField, AdminAlert, AdminButton, AdminPageCenter } from './components';
