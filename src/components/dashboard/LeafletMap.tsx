// Leaflet map implementation - imported dynamically to avoid SSR issues
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Device } from '@/types/device';

interface LeafletMapProps {
  devices: Device[];
  height: string;
}

// Create custom icon based on device status
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

// Component to handle map bounds
function MapBounds({ devices }: { devices: Device[] }) {
  const map = useMap();

  useEffect(() => {
    if (devices.length === 0) return;

    const bounds = L.latLngBounds(
      devices
        .filter((d) => d.location)
        .map((d) => [d.location!.lat, d.location!.lng])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [devices, map]);

  return null;
}

export default function LeafletMap({ devices, height }: LeafletMapProps) {
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

  // Calculate center from devices
  const center: [number, number] = [
    devicesWithLocation.reduce((sum, d) => sum + d.location!.lat, 0) / devicesWithLocation.length,
    devicesWithLocation.reduce((sum, d) => sum + d.location!.lng, 0) / devicesWithLocation.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height, width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds devices={devicesWithLocation} />
      
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