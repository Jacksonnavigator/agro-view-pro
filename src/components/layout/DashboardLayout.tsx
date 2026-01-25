// Main dashboard layout wrapper component
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function DashboardLayout() {
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DeviceProvider>
      <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-background">
        {/* Desktop Sidebar (Fixed) */}
        <div className="hidden lg:block h-full">
          <Sidebar />
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
        <main className="flex-1 h-full overflow-y-auto transition-all duration-300 scroll-smooth">
          <div className="container px-4 py-6 md:px-6 lg:py-8 max-w-7xl mx-auto pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </DeviceProvider>
  );
}
