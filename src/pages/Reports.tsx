// Reports and data export page
import { useState } from 'react';
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
  FileText, 
  Calendar as CalendarIcon,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { devices, plots } = useDevices();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  const handleExport = (type: string) => {
    toast({
      title: 'Export Started',
      description: `Your ${type} report is being generated...`,
    });
    
    // Simulate export delay
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: `${type} report has been downloaded successfully.`,
      });
    }, 2000);
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const selectAllDevices = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map((d) => d.id));
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <Header 
        title="Reports & Export" 
        subtitle="Generate and download sensor data reports"
      />

      {/* Quick export cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer card-hover border-border/50"
          onClick={() => handleExport('Daily Summary')}
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
          className="cursor-pointer card-hover border-border/50"
          onClick={() => handleExport('Weekly Report')}
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
          className="cursor-pointer card-hover border-border/50"
          onClick={() => handleExport('Monthly Analysis')}
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

        <Card 
          className="cursor-pointer card-hover border-border/50"
          onClick={() => handleExport('Alert History')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-medium">Alert History</p>
                <p className="text-sm text-muted-foreground">All alerts log</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom report builder */}
      <Card>
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
              <Label>Select Devices</Label>
              <Button variant="ghost" size="sm" onClick={selectAllDevices}>
                {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {devices
                .filter((d) => selectedPlot === 'all' || d.plotId === selectedPlot)
                .map((device) => (
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

          {/* Export format and action */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-4 border-t">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(v: 'csv' | 'xlsx' | 'pdf') => setExportFormat(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => handleExport('Custom Report')} 
              className="gap-2"
              disabled={selectedDevices.length === 0}
            >
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
