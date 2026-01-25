// Settings page (admin only)
import { useState, useEffect, forwardRef } from 'react';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SensorThresholds } from '@/types/device';
import { PlotLocationManager } from '@/components/admin/PlotLocationManager';

interface SettingsState {

  thresholds: SensorThresholds;
  system: {
    refreshInterval: number;
    retention: number;
    offlineDetection: boolean;
  };
  account: {
    reportEmail: string;
  };
}

const defaultSettings: SettingsState = {

  thresholds: {
    moisture: { min: 30, max: 70 },
    temperature: { min: 15, max: 35 },
    ph: { min: 5.5, max: 7.5 },
    ec: { min: 0.5, max: 2.5 },
  },
  system: {
    refreshInterval: 30,
    retention: 90,
    offlineDetection: true,
  },
  account: {
    reportEmail: '',
  },
};

const Settings = forwardRef<HTMLDivElement, object>(function Settings(_props, ref) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    } else if (user?.email) {
      // Initialize report email with user email if not set
      setSettings(prev => ({
        ...prev,
        account: { ...prev.account, reportEmail: user.email }
      }));
    }
    setHasLoaded(true);
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully and saved to local storage.',
    });
  };





  const updateThreshold = (sensor: keyof SensorThresholds, bound: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [sensor]: { ...prev.thresholds[sensor], [bound]: numValue }
      }
    }));
  };

  const updateSystem = (key: keyof SettingsState['system'], value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      system: { ...prev.system, [key]: value }
    }));
  };

  const updateAccount = (key: keyof SettingsState['account'], value: string) => {
    setSettings(prev => ({
      ...prev,
      account: { ...prev.account, [key]: value }
    }));
  };

  if (!hasLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <div className="space-y-6 fade-in">
      <Header
        title="Settings"
        subtitle="Configure system preferences and notifications"
      />

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
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
                        value={settings.thresholds.moisture.min}
                        onChange={(e) => updateThreshold('moisture', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        value={settings.thresholds.moisture.max}
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
                        value={settings.thresholds.temperature.min}
                        onChange={(e) => updateThreshold('temperature', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        value={settings.thresholds.temperature.max}
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
                        value={settings.thresholds.ph.min}
                        onChange={(e) => updateThreshold('ph', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.thresholds.ph.max}
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
                        value={settings.thresholds.ec.min}
                        onChange={(e) => updateThreshold('ec', 'min', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Max</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.thresholds.ec.max}
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

        {/* Plot Locations tab */}
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
                    value={settings.system.refreshInterval}
                    onChange={(e) => updateSystem('refreshInterval', parseInt(e.target.value) || 30)}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
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
                    value={settings.system.retention}
                    onChange={(e) => updateSystem('retention', parseInt(e.target.value) || 90)}
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Older data will be archived automatically
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
                  checked={settings.system.offlineDetection}
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
                  value={settings.account.reportEmail}
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
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div >
  );
});

Settings.displayName = 'Settings';

export default Settings;
