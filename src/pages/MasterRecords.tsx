import { useMemo, useState, forwardRef } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Header } from '@/components/layout/Header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { HistoricalReading } from '@/types/device';
import { Download, Database, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportHistoricalDataCSV } from '@/utils/exportUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UI_CONFIG } from '@/config/app-config';

const MasterRecords = forwardRef<HTMLDivElement, object>(function MasterRecords(_props, ref) {
    const { devices, getDeviceHistory, isLoading } = useDevices();
    const [hours, setHours] = useState(24);

    const allRecords = useMemo(() => {
        const records: Array<{ deviceName: string; plotName: string } & HistoricalReading> = [];
        devices.forEach(device => {
            const history = getDeviceHistory(device.id, hours);
            history.forEach(reading => {
                records.push({
                    ...reading,
                    deviceName: device.name,
                    plotName: device.plotName,
                });
            });
        });
        return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [devices, getDeviceHistory, hours]);

    return (
        <div className="space-y-6 fade-in">
            <Header
                title="Master System Records"
                subtitle="Unabridged chronological log of every sensor transmission across the entire network"
            >
                <div className="flex items-center gap-3">
                    <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
                        <SelectTrigger className="w-[130px] h-9 border-white/5 bg-white/5">
                            <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Last Hour</SelectItem>
                            <SelectItem value="24">Last 24 Hours</SelectItem>
                            <SelectItem value="168">Last 7 Days</SelectItem>
                            <SelectItem value="720">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-white/5 bg-white/5 hover:bg-white/10"
                        onClick={() => exportHistoricalDataCSV(
                            devices,
                            new Date(Date.now() - hours * 60 * 60 * 1000),
                            new Date(),
                            getDeviceHistory
                        )}
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export Log</span>
                    </Button>
                </div>
            </Header>

            <Card className="premium-card border-white/5 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent bg-white/[0.02]">
                                    <TableHead className="w-[200px]">Timestamp</TableHead>
                                    <TableHead>Source Device</TableHead>
                                    <TableHead className="text-right">Moisture</TableHead>
                                    <TableHead className="text-right">Temp</TableHead>
                                    <TableHead className="text-right">pH</TableHead>
                                    <TableHead className="text-right">EC</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground italic">
                                            Synchronizing with global data registry...
                                        </TableCell>
                                    </TableRow>
                                ) : allRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                            No transmission records found for the selected period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allRecords.slice(0, UI_CONFIG.pagination.maxDisplayedRecords).map((record, i) => (
                                        <TableRow key={`${record.deviceName}-${record.timestamp.getTime()}-${i}`} className="border-white/5 hover:bg-white/[0.03] transition-colors text-[12px]">
                                            <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                                                {format(record.timestamp, 'MMM d, HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{record.deviceName}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{record.plotName}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-info">{record.readings.moisture}%</TableCell>
                                            <TableCell className="text-right font-mono text-warning">{record.readings.temperature}°C</TableCell>
                                            <TableCell className="text-right font-mono text-success">{record.readings.ph}</TableCell>
                                            <TableCell className="text-right font-mono text-purple-400">{record.readings.ec}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center px-2">
                <div className="text-[11px] text-muted-foreground">
                    Showing latest {Math.min(allRecords.length, UI_CONFIG.pagination.maxDisplayedRecords)} transmissions across {devices.length} active units
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground animate-pulse">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    Live Master Feed Active
                </div>
            </div>
        </div>
    );
});

MasterRecords.displayName = 'MasterRecords';

export default MasterRecords;
