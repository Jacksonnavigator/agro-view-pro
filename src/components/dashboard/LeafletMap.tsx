// Leaflet map implementation - imported dynamically to avoid SSR issues
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon } from 'lucide-react';
import { STATUS_COLORS } from '@/config/app-config';

interface LeafletMapProps {
  devices: Device[];
  height: string;
  plots?: Array<{
    id: string;
    name: string;
    location?: { lat: number; lng: number };
  }>;
}

// Create custom icon based on device status
const createCustomIcon = (status: Device['status']) => {
  const color = status === 'online' ? STATUS_COLORS.online : status === 'warning' ? STATUS_COLORS.warning : STATUS_COLORS.offline;
  
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

// Create plot location icon
const createPlotIcon = () => {
  return L.divIcon({
    className: 'plot-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${STATUS_COLORS.processing};
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to handle map bounds
function MapBounds({ devices, plots }: { 
  devices: Device[]; 
  plots?: Array<{ id: string; name: string; location?: { lat: number; lng: number } }>;
}) {
  const map = useMap();

  useEffect(() => {
    const allLocations = [
      ...devices.filter((d) => d.location).map((d) => d.location!),
      ...(plots?.filter((p) => p.location).map((p) => p.location!) || [])
    ];

    if (allLocations.length === 0) return;

    const bounds = L.latLngBounds(allLocations.map((loc) => [loc.lat, loc.lng]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [devices, plots, map]);

  return null;
}

export default function LeafletMap({ devices, height, plots }: LeafletMapProps) {
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const devicesWithLocation = devices.filter((d) => d.location);
  const plotsWithLocation = plots?.filter((p) => p.location) || [];

  if (devicesWithLocation.length === 0 && plotsWithLocation.length === 0) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border bg-muted"
        style={{ height }}
      >
        <p className="text-muted-foreground">No devices or plots with location data</p>
      </div>
    );
  }

  // Calculate center from all locations
  const allLocations = [
    ...devicesWithLocation.map((d) => d.location!),
    ...plotsWithLocation.map((p) => p.location!)
  ];
  
  const center: [number, number] = [
    allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length,
    allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length,
  ];

  return (
    <div className="relative" style={{ height, width: '100%' }}>
      {/* Map Type Switcher */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-1">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mapType === 'street' ? 'default' : 'ghost'}
            onClick={() => setMapType('street')}
            className="gap-1 h-8 px-2"
          >
            <MapIcon className="h-3 w-3" />
            Street
          </Button>
          <Button
            size="sm"
            variant={mapType === 'satellite' ? 'default' : 'ghost'}
            onClick={() => setMapType('satellite')}
            className="gap-1 h-8 px-2"
          >
            <Satellite className="h-3 w-3" />
            Satellite
          </Button>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={mapType === 'street' 
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            : '&copy; <a href="https://www.esri.com/">Esri</a>'
          }
          url={mapType === 'street'
            ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          }
          maxZoom={19}
          tileSize={256}
          detectRetina={true}
        />
        <MapBounds devices={devicesWithLocation} plots={plotsWithLocation} />
        
        {/* Plot markers */}
        {plotsWithLocation.map((plot) => (
          <Marker
            key={plot.id}
            position={[plot.location!.lat, plot.location!.lng]}
            icon={createPlotIcon()}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="font-semibold">{plot.name}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Plot Location</p>
                  <p>Lat: <span className="font-mono">{plot.location!.lat.toFixed(6)}</span></p>
                  <p>Lng: <span className="font-mono">{plot.location!.lng.toFixed(6)}</span></p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Device markers */}
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
                  <p>Moisture: <span className="font-mono">{device.readings?.moisture ?? 'N/A'}%</span></p>
                  <p>Temperature: <span className="font-mono">{device.readings?.temperature ?? 'N/A'}°C</span></p>
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
    </div>
  );
}