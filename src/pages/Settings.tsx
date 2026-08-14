// Settings page (admin only)
import { useEffect, useState, forwardRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Shield,
  Database,
  Wifi,
  Clock,
  Save,
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
  Cpu,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, SensorThresholds } from '@/types/device';
import { PlotLocationManager } from '@/components/admin/PlotLocationManager';
import { SYSTEM_CONFIG } from '@/config/app-config';

const Settings = forwardRef<HTMLDivElement, object>(function Settings(_props, ref) {
  const { user, hasRole } = useAuth();
  const { settings, updateSettings, devices, deviceFreshness } = useDevices();
  const { toast } = useToast();
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const isAdmin = hasRole('admin');

  if (!isAdmin) {
    return (
      <div className="space-y-6 fade-in">
        <Header title="Settings" subtitle="System overview and access status" />
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Read-only Access
            </CardTitle>
            <CardDescription>
              You are signed in as a viewer. You can review the current system configuration, but changes must be made by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">User Role</p>
                <p className="mt-2 text-xl font-semibold capitalize">{user?.role || 'viewer'}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Connected Devices</p>
                <p className="mt-2 text-xl font-semibold">{devices.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="mt-2 text-xl font-semibold">{deviceFreshness.latestSensorTimestamp ? 'Live' : 'Offline'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(draftSettings);
      toast({
        title: 'Settings Saved',
        description: 'Configuration has been persisted to Firebase.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Unable to save settings to Firebase.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };





  const updateThreshold = (sensor: keyof SensorThresholds, bound: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    setDraftSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [sensor]: { ...prev.thresholds[sensor], [bound]: numValue }
      }
    }));
  };

  const updateSystem = (key: keyof AppSettings['system'], value: number | boolean) => {
    setDraftSettings(prev => ({
      ...prev,
      system: { ...prev.system, [key]: value }
    }));
  };

  const updateAccount = (key: keyof AppSettings['account'], value: string) => {
    setDraftSettings(prev => ({
      ...prev,
      account: { ...prev.account, [key]: value }
    }));
  };

  return (
    <div className="space-y-6 fade-in">
      <Header
        title="Settings"
        subtitle="Configure system preferences and notifications"
      />

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="info">System Info</TabsTrigger>
          <TabsTrigger value="plots">Plot Locations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Thresholds tab */}
        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Sensor Thresholds</CardTitle>
              <CardDescription>
                Set default threshold values for new devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <Label className="text-base">Soil Moisture (%)</Label>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Min</span>
                      <Input
                        type="number"
                        value={draftSettings.thresholds.moisture.min}
                        onChange={(e) => updateThreshold('moisture', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        value={draftSettings.thresholds.moisture.max}
                        onChange={(e) => updateThreshold('moisture', 'max', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Temperature (°C)</Label>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Min</span>
                      <Input
                        type="number"
                        value={draftSettings.thresholds.temperature.min}
                        onChange={(e) => updateThreshold('temperature', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        value={draftSettings.thresholds.temperature.max}
                        onChange={(e) => updateThreshold('temperature', 'max', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">pH Level</Label>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Min</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={draftSettings.thresholds.ph.min}
                        onChange={(e) => updateThreshold('ph', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={draftSettings.thresholds.ph.max}
                        onChange={(e) => updateThreshold('ph', 'max', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">EC (mS/cm)</Label>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Min</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={draftSettings.thresholds.ec.min}
                        onChange={(e) => updateThreshold('ec', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={draftSettings.thresholds.ec.max}
                        onChange={(e) => updateThreshold('ec', 'max', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-success" />
                System Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Connection Status */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Firebase Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                      <span className="text-sm text-muted-foreground">Connected</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Device Summary */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Device Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Online:</span>
                      <span className="font-mono text-success">{deviceFreshness.onlineCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-mono">{devices.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Configuration Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Configuration</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-muted-foreground">Refresh Interval</span>
                    <span className="font-mono text-sm">{SYSTEM_CONFIG.refreshInterval}s</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-muted-foreground">Offline Timeout</span>
                    <span className="font-mono text-sm">{SYSTEM_CONFIG.offlineTimeout}m</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-muted-foreground">Data Retention</span>
                    <span className="font-mono text-sm">{SYSTEM_CONFIG.dataRetention}d</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-muted-foreground">History Limit</span>
                    <span className="font-mono text-sm">{SYSTEM_CONFIG.maxHistoryPoints}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Application Info */}
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Application</h3>
                <div className="flex justify-between text-muted-foreground">
                  <span>Version</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Environment</span>
                  <span className="font-mono capitalize">production</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Theme</span>
                  <span className="font-mono">Light</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-success/5 border border-success/20">
                <span className="text-sm">All systems operational</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">
                Last health check: Just now
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="plots" className="space-y-4">
          {user?.role === 'admin' ? (
            <PlotLocationManager />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  Only administrators can manage plot locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Please contact your system administrator to manage plot locations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Refresh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Auto-refresh Interval</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                  value={draftSettings.system.refreshInterval}
                    onChange={(e) => updateSystem('refreshInterval', parseInt(e.target.value) || 30)}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mark devices offline after</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={draftSettings.system.offlineAfterMinutes}
                    onChange={(e) => updateSystem('offlineAfterMinutes', parseInt(e.target.value, 10) || 5)}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">minutes without readings</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Keep historical data for</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                  value={draftSettings.system.retention}
                    onChange={(e) => updateSystem('retention', parseInt(e.target.value) || 90)}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dashboard history queries only request data within this window
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Device Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Offline Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark device offline after no data for 5 minutes
                  </p>
                </div>
                <Switch
                  checked={draftSettings.system.offlineDetection}
                  onCheckedChange={(c) => updateSystem('offlineDetection', c)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={user?.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} type="email" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role} disabled className="capitalize bg-muted" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Email Address</Label>
                <Input
                  value={draftSettings.account.reportEmail || user?.email || ''}
                  onChange={(e) => updateAccount('reportEmail', e.target.value)}
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Scheduled reports will be sent to this address
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div >
  );
});

Settings.displayName = 'Settings';

export default Settings;
