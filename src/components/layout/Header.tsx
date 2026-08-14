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
  const { isLoading, lastRefresh, refreshData, connectionStatus, deviceFreshness } = useDevices();
  const { hasRole } = useAuth();

  const freshnessLabel = deviceFreshness.hasLiveDevices
    ? `${deviceFreshness.onlineCount} device${deviceFreshness.onlineCount === 1 ? '' : 's'} online`
    : deviceFreshness.latestSensorTimestamp
      ? 'All devices offline'
      : 'No sensor data';
  const FreshnessIcon = deviceFreshness.hasLiveDevices ? Activity : WifiOff;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
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

        {/* Additional actions */}
        <span
          className={cn(
            'hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            connectionStatus === 'connected' && 'bg-success/10 text-success',
            connectionStatus === 'connecting' && 'bg-warning/10 text-warning',
            connectionStatus === 'disconnected' && 'bg-destructive/10 text-destructive'
          )}
        >
          Firebase {connectionStatus}
        </span>
        {children}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
