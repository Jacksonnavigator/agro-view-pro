// Dashboard header component with refresh controls
import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Activity, WifiOff, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header({ title, subtitle, children }, ref) {
  const navigate = useNavigate();
  const { isLoading, lastRefresh, refreshData, deviceFreshness } = useDevices();
  const { hasRole } = useAuth();

  const freshnessLabel = deviceFreshness.hasLiveDevices
    ? `${deviceFreshness.onlineCount} device${deviceFreshness.onlineCount === 1 ? '' : 's'} online`
    : deviceFreshness.latestSensorTimestamp
      ? 'All devices offline'
      : 'No sensor data';
  const FreshnessIcon = deviceFreshness.hasLiveDevices ? Activity : WifiOff;

  return (
    <header className="flex flex-col gap-5 rounded-[26px] border border-slate-200/80 bg-white/70 px-5 py-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-600">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Device freshness indicator */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5',
            deviceFreshness.hasLiveDevices ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}
        >
          <FreshnessIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{freshnessLabel}</span>
        </div>

        {/* Last updated indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {deviceFreshness.latestSensorTimestamp
              ? `Latest sensor ${formatDistanceToNow(deviceFreshness.latestSensorTimestamp, { addSuffix: true })}`
              : `Checked ${formatDistanceToNow(lastRefresh, { addSuffix: true })}`}
          </span>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading}
          className="gap-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-secondary/80"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Settings button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
          className="gap-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-secondary/80"
          title="System Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>

        {children}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
