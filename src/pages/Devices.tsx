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
  Wifi,
  Battery,
  ExternalLink,
  Droplets,
  Thermometer,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DeviceStatus } from '@/types/device';
import { useDebounce } from '@/hooks/useDebounce';

const ITEMS_PER_PAGE = 10;

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
        title="Devices"
        subtitle="Manage and monitor all sensor devices"
      />

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
                  <SelectItem value="warning">Warning</SelectItem>
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

      {/* Devices table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Moisture</TableHead>
                <TableHead className="hidden md:table-cell">Temp</TableHead>
                <TableHead className="hidden lg:table-cell">Signal</TableHead>
                <TableHead className="hidden lg:table-cell">Battery</TableHead>
                <TableHead className="hidden sm:table-cell">Last Update</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDevices.map((device) => (
                <TableRow key={device.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.plotName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusIndicator status={device.status} showLabel size="sm" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <Droplets className="h-3.5 w-3.5 text-chart-moisture" />
                      {device.readings.moisture}%
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <Thermometer className="h-3.5 w-3.5 text-chart-temperature" />
                      {device.readings.temperature}°C
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Wifi className="h-3.5 w-3.5" />
                      {device.signalStrength}%
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Battery className="h-3.5 w-3.5" />
                      {device.batteryLevel}%
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {formatDistanceToNow(device.lastUpdated, { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Link to={`/device/${device.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDevices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <p className="text-muted-foreground">No devices found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="py-4 border-t">
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
        )}
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        Showing {paginatedDevices.length} of {filteredDevices.length} devices
      </div>
    </div>
  );
});

Devices.displayName = 'Devices';

export default Devices;
