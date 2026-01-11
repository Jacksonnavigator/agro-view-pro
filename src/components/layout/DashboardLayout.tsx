// Main dashboard layout wrapper component
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DeviceProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Main content area with sidebar offset */}
        <main className="ml-16 lg:ml-64 min-h-screen transition-all duration-300">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </DeviceProvider>
  );
}
