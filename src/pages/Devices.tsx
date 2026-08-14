// Devices listing page with filters, debounced search, pagination, and error handling
import { useState, useMemo, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import {
  Search,
  Filter,
  ExternalLink,
  Droplets,
  Thermometer,
  Download,
} from 'lucide-react';
import { exportDevicesCSV } from '@/utils/exportUtils';
import { formatDistanceToNow } from 'date-fns';
import { DeviceStatus } from '@/types/device';
import { useDebounce } from '@/hooks/useDebounce';
import { UI_CONFIG } from '@/config/app-config';

const ITEMS_PER_PAGE = UI_CONFIG.pagination.itemsPerPage;

const Devices = forwardRef<HTMLDivElement, object>(function Devices(_props, ref) {
  const { devices, plots, isLoading, error, refreshData } = useDevices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input to prevent UI freezing with large datasets
  const debouncedSearch = useDebounce(search, 300);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, plotFilter]);

  // Filter devices based on debounced search and filters
  const filteredDevices = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase().trim();

    return devices.filter((device) => {
      // Skip search matching if empty
      const matchesSearch = !searchLower ||
        device.name.toLowerCase().includes(searchLower) ||
        device.plotName.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesPlot = plotFilter === 'all' || device.plotId === plotFilter;

      return matchesSearch && matchesStatus && matchesPlot;
    });
  }, [devices, debouncedSearch, statusFilter, plotFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDevices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDevices, currentPage]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    // Always show first, last, current, and neighbors
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && i > 1) ||
        (i === currentPage + 2 && i < totalPages)
      ) {
        pages.push('ellipsis');
      }
    }
    // Remove duplicates (e.g. if ellipsis logic overlaps)
    return [...new Set(pages)];
  };

  // Loading state
  if (isLoading && devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (error && devices.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <ErrorState
          title="Failed to Load Devices"
          message={error}
          onRetry={refreshData}
          variant="connection"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <Header
        title="Live Data Hub"
        subtitle="Comprehensive real-time monitoring across the entire sensor network"
      >
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 animate-glow-pulse">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Monitor Active</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/5 bg-white/5 hover:bg-white/10"
            onClick={() => exportDevicesCSV(devices)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        </div>
      </Header>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DeviceStatus | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={plotFilter} onValueChange={setPlotFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Plots" />
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
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card border-white/5 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[200px]">Device & Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Moisture</TableHead>
                  <TableHead className="text-right">Temp</TableHead>
                  <TableHead className="text-right">pH</TableHead>
                  <TableHead className="text-right">EC</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDevices.map((device) => (
                  <TableRow key={device.id} className="group border-white/5 hover:bg-white/[0.02] transition-colors text-[13px]">
                    <TableCell>
                      <div className="py-1">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{device.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{device.plotName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator status={device.status} showLabel size="sm" />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-info">{device.readings.moisture}%</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-warning">{device.readings.temperature}°C</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-success">{device.readings.ph}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-purple-400">
                      {device.readings.ec}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20 hover:text-primary"
                      >
                        <Link to={`/device/${device.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredDevices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <p className="text-muted-foreground">No devices found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {
          totalPages > 1 && (
            <CardFooter className="py-4 border-t border-white/5">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => { e.preventDefault(); setCurrentPage(page as number); }}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )
        }
      </Card >

      <div className="text-sm text-muted-foreground text-center">
        Showing {paginatedDevices.length} of {filteredDevices.length} devices
      </div>
    </div >
  );
});

Devices.displayName = 'Devices';

export default Devices;
