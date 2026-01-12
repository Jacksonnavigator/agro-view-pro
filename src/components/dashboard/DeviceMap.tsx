// Interactive map component showing device locations
import { useEffect, useState } from 'react';
import { Device } from '@/types/device';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DeviceMapProps {
  devices: Device[];
  className?: string;
  height?: string;
}

// Lazy load the map implementation to avoid SSR issues
function DeviceMapInner({ devices, height }: { devices: Device[]; height: string }) {
  const [mapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    useMap: any;
    L: any;
  } | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet and react-leaflet
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([reactLeaflet, leaflet]) => {
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        useMap: reactLeaflet.useMap,
        L: leaflet.default
      });
    });
  }, []);

  if (!mapComponents) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border bg-muted"
        style={{ height }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = mapComponents;

  const devicesWithLocation = devices.filter((d) => d.location);

  if (devicesWithLocation.length === 0) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border bg-muted"
        style={{ height }}
      >
        <p className="text-muted-foreground">No devices with location data</p>
      </div>
    );
  }

  // Create custom icon
  const createCustomIcon = (status: Device['status']) => {
    const color = status === 'online' ? '#22c55e' : status === 'warning' ? '#eab308' : '#ef4444';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // Calculate center from devices
  const center: [number, number] = [
    devicesWithLocation.reduce((sum, d) => sum + d.location!.lat, 0) / devicesWithLocation.length,
    devicesWithLocation.reduce((sum, d) => sum + d.location!.lng, 0) / devicesWithLocation.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {devicesWithLocation.map((device) => (
        <Marker
          key={device.id}
          position={[device.location!.lat, device.location!.lng]}
          icon={createCustomIcon(device.status)}
        >
          <Popup>
            <div className="min-w-[200px] p-1">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: device.status === 'online' ? '#22c55e' : 
                                     device.status === 'warning' ? '#eab308' : '#ef4444' 
                  }}
                />
                <span className="font-semibold">{device.name}</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Plot: {device.plotName}</p>
                <p>Moisture: <span className="font-mono">{device.readings.moisture}%</span></p>
                <p>Temperature: <span className="font-mono">{device.readings.temperature}°C</span></p>
              </div>
              <a 
                href={`/device/${device.id}`}
                className="block mt-2 text-center text-sm text-blue-600 hover:underline"
              >
                View Details
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function DeviceMap({ devices, className, height = '400px' }: DeviceMapProps) {
  return (
    <div className={cn('rounded-lg overflow-hidden border', className)} style={{ height }}>
      <DeviceMapInner devices={devices} height={height} />
    </div>
  );
}
