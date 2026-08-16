// Main dashboard layout wrapper component
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DeviceProvider>
      <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-background">
        {/* Desktop Sidebar (Fixed) */}
        <div className="hidden lg:block h-full">
          <Sidebar collapsed={isSidebarCollapsed} onCollapsedChange={setIsSidebarCollapsed} />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 border border-white/5 bg-white/5">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r border-sidebar-border/50 bg-sidebar-background w-64">
                <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 ml-2">
              <img src="/favicon.png" alt="Logo" className="h-7 w-7" />
              <span className="font-bold text-sm tracking-tight">AgroView Pro</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main
          className={cn(
            'flex-1 h-full overflow-y-auto transition-[padding] duration-300 scroll-smooth',
            isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          )}
        >
          <div className="w-full">
            <div className="container mx-auto max-w-[1400px] px-4 py-6 md:px-5 lg:px-7 lg:py-8 pb-24 lg:pb-12 xl:px-8">
              <div className="space-y-8">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </DeviceProvider>
  );
}
