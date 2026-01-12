// Main navigation sidebar component with enhanced styling
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Cpu,
  Bell,
  MapPin,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Leaf,
  GitCompare,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/devices', label: 'Devices', icon: Cpu },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/alerts', label: 'Alerts', icon: Bell, badge: true },
  { path: '/plots', label: 'Plots', icon: MapPin },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { unacknowledgedAlertCount } = useDevices();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border/50 bg-gradient-to-b from-sidebar-background to-sidebar-background/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 px-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
              <Leaf className="h-5 w-5 text-primary-foreground" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-warning animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-sidebar-foreground">SoilMonitor</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">IoT Dashboard</p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent/80"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            // Hide admin-only items from non-admin users
            if (item.adminOnly && !hasRole('admin')) return null;

            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive && 'text-primary'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && unacknowledgedAlertCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground shadow-lg shadow-destructive/30">
                        {unacknowledgedAlertCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && unacknowledgedAlertCount > 0 && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive shadow-lg shadow-destructive/50 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border/50 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-success/20 text-sm font-bold text-primary ring-2 ring-primary/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-full p-0 text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
