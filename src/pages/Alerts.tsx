// Alerts management page
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  MessageSquare,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertSeverity } from '@/types/device';

const severityConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    iconColor: 'text-info',
    badgeVariant: 'secondary' as const,
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconColor: 'text-warning',
    badgeVariant: 'outline' as const,
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    iconColor: 'text-destructive',
    badgeVariant: 'destructive' as const,
  },
};

export default function Alerts() {
  const { alerts, acknowledgeAlert, devices } = useDevices();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged'>('all');

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && !alert.acknowledged) ||
        (statusFilter === 'acknowledged' && alert.acknowledged);

      return matchesSeverity && matchesStatus;
    });
  }, [alerts, severityFilter, statusFilter]);

  // Stats
  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => !a.acknowledged).length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
  };

  const acknowledgeAll = () => {
    filteredAlerts.filter((a) => !a.acknowledged).forEach((a) => acknowledgeAlert(a.id));
  };

  return (
    <div className="space-y-6 fade-in">
      <Header 
        title="Alert Center" 
        subtitle="Monitor and manage system alerts"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={acknowledgeAll}
          disabled={stats.active === 0}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          Acknowledge All
        </Button>
      </Header>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="font-mono text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="font-mono text-2xl font-bold text-warning">{stats.active}</p>
              </div>
              <div className="rounded-lg bg-warning/20 p-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="font-mono text-2xl font-bold text-destructive">{stats.critical}</p>
              </div>
              <div className="rounded-lg bg-destructive/20 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-2">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AlertSeverity | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'acknowledged')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <Card
              key={alert.id}
              className={cn(
                'transition-all',
                config.bgColor,
                config.borderColor,
                alert.acknowledged && 'opacity-60'
              )}
            >
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className={cn('mt-0.5', config.iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.message}</p>
                          <Badge variant={config.badgeVariant} className="capitalize">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.deviceName} • {alert.plotName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                        >
                          <Link to={`/device/${alert.deviceId}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">
                        {format(alert.timestamp, 'PPp')}
                      </span>
                      <span>
                        Value: <span className="font-mono text-foreground">{alert.value}</span>
                        {' → '}
                        Threshold: <span className="font-mono text-foreground">{alert.threshold}</span>
                      </span>
                      {alert.smsSent && (
                        <span className="flex items-center gap-1 text-success">
                          <MessageSquare className="h-3.5 w-3.5" />
                          SMS notification sent
                        </span>
                      )}
                      {alert.acknowledged && (
                        <span className="flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-success/10 p-3 mb-3">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-muted-foreground">No alerts found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All systems operating within normal parameters
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
