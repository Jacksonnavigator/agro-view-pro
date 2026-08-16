// Reports and data export page with real CSV export functionality
import { useState, forwardRef } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  BarChart3,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  exportDevicesCSV,
  exportHistoricalDataCSV,
  exportDailySummary,
  exportWeeklyReport,
  exportMonthlyReport,
} from '@/utils/exportUtils';

const Reports = forwardRef<HTMLDivElement, object>(function Reports(_props, ref) {
  const { devices, plots, getDeviceHistory, isLoading } = useDevices();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async (type: 'daily' | 'weekly' | 'monthly') => {
    setIsExporting(true);
    toast({
      title: 'Export Started',
      description: 'Generating your report...',
    });

    // Simulate slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      switch (type) {
        case 'daily':
          exportDailySummary(devices, getDeviceHistory);
          break;
        case 'weekly':
          exportWeeklyReport(devices, getDeviceHistory);
          break;
        case 'monthly':
          exportMonthlyReport(devices, getDeviceHistory);
          break;
      }

      toast({
        title: 'Export Complete',
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            Your report has been downloaded successfully.
          </span>
        ),
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error generating your report.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    if (selectedDevices.length === 0) {
      toast({
        title: 'No Devices Selected',
        description: 'Please select at least one device to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: 'Export Started',
      description: 'Generating your custom report...',
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const selectedDeviceData = devices.filter((d) => selectedDevices.includes(d.id));

      exportHistoricalDataCSV(selectedDeviceData, dateRange.from, dateRange.to, getDeviceHistory);

      toast({
        title: 'Export Complete',
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            Your custom report has been downloaded.
          </span>
        ),
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error generating your report.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const selectAllDevices = () => {
    const filteredDevices = devices.filter(
      (d) => selectedPlot === 'all' || d.plotId === selectedPlot
    );
    if (filteredDevices.length === 0) {
      setSelectedDevices([]);
    } else if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  // Filter devices when plot changes
  const filteredDevices = devices.filter(
    (d) => selectedPlot === 'all' || d.plotId === selectedPlot
  );

  return (
    <div className="space-y-6 fade-in">
      <Header
        title="Reports & Export"
        subtitle="Generate and download sensor data reports"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-50 shadow-[0_18px_30px_-28px_rgba(16,185,129,0.35)]">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total devices</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{devices.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-sky-500/10 to-sky-50 shadow-[0_18px_30px_-28px_rgba(59,130,246,0.35)]">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Date range</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">{format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-50 shadow-[0_18px_30px_-28px_rgba(245,158,11,0.35)]">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Selected</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{selectedDevices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick export cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={cn(
            'cursor-pointer border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5',
            (isExporting || isLoading) && 'opacity-50 pointer-events-none'
          )}
          onClick={() => handleQuickExport('daily')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer border-0 bg-gradient-to-br from-success/10 to-success/5 shadow-[0_18px_35px_-28px_rgba(34,197,94,0.18)] transition-all hover:-translate-y-0.5',
            (isExporting || isLoading) && 'opacity-50 pointer-events-none'
          )}
          onClick={() => handleQuickExport('weekly')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium">Weekly Report</p>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer border-0 bg-gradient-to-br from-info/10 to-info/5 shadow-[0_18px_35px_-28px_rgba(59,130,246,0.18)] transition-all hover:-translate-y-0.5',
            (isExporting || isLoading) && 'opacity-50 pointer-events-none'
          )}
          onClick={() => handleQuickExport('monthly')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-info/10 p-3">
                <TrendingUp className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-medium">Monthly Analysis</p>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Quick device export */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.55)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Export Current Device Status</p>
                <p className="text-sm text-slate-300">
                  {isLoading ? 'Loading current readings...' : `Download current readings for all ${devices.length} devices`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => exportDevicesCSV(devices)}
              disabled={isExporting || isLoading || devices.length === 0}
              className="gap-2 bg-white text-slate-900 hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom report builder */}
      <Card className="border-0 bg-gradient-to-br from-card to-slate-50/80 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.18)]">
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
          <CardDescription>
            Build a custom report with specific date range and devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date range selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange((prev) => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange((prev) => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Plot filter */}
          <div className="space-y-2">
            <Label>Filter by Plot</Label>
            <Select value={selectedPlot} onValueChange={setSelectedPlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plots</SelectItem>
                {plots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Devices ({selectedDevices.length} selected)</Label>
              <Button variant="ghost" size="sm" onClick={selectAllDevices}>
                {filteredDevices.length > 0 && selectedDevices.length === filteredDevices.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                    selectedDevices.includes(device.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-secondary/50'
                  )}
                  onClick={() => toggleDevice(device.id)}
                >
                  <Checkbox
                    checked={selectedDevices.includes(device.id)}
                    onCheckedChange={() => toggleDevice(device.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.plotName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

              {/* Export action */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-4 border-t">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <p className="text-sm text-muted-foreground">CSV (.csv)</p>
            </div>

            <Button
              onClick={handleCustomExport}
              className="gap-2"
              disabled={selectedDevices.length === 0 || isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

Reports.displayName = 'Reports';

export default Reports;
