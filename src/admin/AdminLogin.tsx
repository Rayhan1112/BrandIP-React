import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import {
  AdminLogo,
  AdminCard,
  AdminFormField,
  AdminAlert,
  AdminButton,
  AdminPageCenter,
} from './components';

export function AdminLogin() {
  const { isAuthenticated, isLoading, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <AdminPageCenter>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageCenter>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(result.error?.message || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <AdminPageCenter>
      <AdminCard>
        <div className="text-center mb-8">
          <AdminLogo size="lg" showTagline center className="mb-2" />
          <h1 className="text-2xl font-semibold text-gray-800 mt-6">Admin Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">Use your admin credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminFormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="admin@gmail.com"
            autoComplete="email"
            required
          />
          <AdminFormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && <AdminAlert message={error} />}
          <AdminButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </AdminButton>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Admin email: <strong>admin@gmail.com</strong>
        </p>
      </AdminCard>
    </AdminPageCenter>
  );
}
