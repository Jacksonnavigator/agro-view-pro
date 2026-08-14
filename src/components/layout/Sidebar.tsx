// Main navigation sidebar component with enhanced styling
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Cpu,
  MapPin,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  GitCompare,
  Database,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/devices', label: 'Live Data Hub', icon: Cpu },
  { path: '/master-records', label: 'Master Records', icon: Database },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/plots', label: 'Plots', icon: MapPin },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onNavigate, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-sidebar-border/50 bg-gradient-to-b from-sidebar-background to-sidebar-background/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 px-4 bg-gradient-to-r from-primary/5 via-transparent to-amber-400/5">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-amber-400 shadow-[0_12px_20px_-12px_rgba(16,185,129,0.8)] ring-2 ring-white/70">
              <img
                src="/favicon.png"
                alt="AgroView Pro"
                className="h-6 w-6 rounded-lg"
              />
            </div>
            <div>
              <span className="font-bold text-sidebar-foreground">AgroView Pro</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Luxury Farm Tech</p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:flex h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent/80"
          onClick={toggleCollapsed}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onNavigate?.()}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
                )}
                <item.icon className={cn(
                  'h-5 w-5 shrink-0 transition-all duration-300',
                  isActive ? 'text-primary scale-110' : 'group-hover:scale-110'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                  </>
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
