// Interactive map for selecting plot locations
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon } from 'lucide-react';

interface InteractiveMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
  plotDevices: Device[];
  height?: string;
}

// Custom icon for plot location marker
const plotLocationIcon = L.divIcon({
  className: 'plot-location-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
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

// Custom icon for existing devices
const deviceIcon = (status: Device['status']) => {
  const color = status === 'online' ? '#22c55e' : status === 'warning' ? '#eab308' : '#ef4444';
  
  return L.divIcon({
    className: 'device-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle map bounds and center
function MapController({ 
  initialLocation, 
  devicesWithLocation 
}: { 
  initialLocation?: { lat: number; lng: number };
  devicesWithLocation: Device[];
}) {
  const map = useMap();

  useEffect(() => {
    if (initialLocation) {
      map.setView([initialLocation.lat, initialLocation.lng], 15);
    } else if (devicesWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        devicesWithLocation.map((d) => [d.location!.lat, d.location!.lng])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Default to agricultural region (e.g., California Central Valley)
      map.setView([36.7783, -119.4179], 10);
    }
  }, [map, initialLocation, devicesWithLocation]);

  return null;
}

export default function InteractiveMap({ 
  onLocationSelect, 
  initialLocation, 
  plotDevices, 
  height = '400px' 
}: InteractiveMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  const devicesWithLocation = plotDevices.filter((d) => d.location);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationSelect(lat, lng);
  };

  // Default center if no devices or initial location
  const defaultCenter: [number, number] = initialLocation 
    ? [initialLocation.lat, initialLocation.lng]
    : devicesWithLocation.length > 0
    ? [
        devicesWithLocation.reduce((sum, d) => sum + d.location!.lat, 0) / devicesWithLocation.length,
        devicesWithLocation.reduce((sum, d) => sum + d.location!.lng, 0) / devicesWithLocation.length,
      ]
    : [36.7783, -119.4179]; // California Central Valley

  return (
    <div style={{ height: '100%', width: '100%', minHeight: height }}>
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
        center={defaultCenter}
        zoom={devicesWithLocation.length > 0 ? 13 : 10}
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

        <MapController 
          initialLocation={initialLocation} 
          devicesWithLocation={devicesWithLocation} 
        />

        <MapClickHandler onLocationSelect={handleLocationSelect} />

        {/* Plot location marker */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={plotLocationIcon}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="font-semibold mb-2">Plot Location</div>
                <div className="space-y-1 text-sm">
                  <p>Latitude: <span className="font-mono">{selectedLocation.lat.toFixed(6)}</span></p>
                  <p>Longitude: <span className="font-mono">{selectedLocation.lng.toFixed(6)}</span></p>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Click elsewhere on the map to update location
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing device markers */}
        {devicesWithLocation.map((device) => (
          <Marker
            key={device.id}
            position={[device.location!.lat, device.location!.lng]}
            icon={deviceIcon(device.status)}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
        <div className="text-sm space-y-1">
          <div className="font-semibold">Map Instructions</div>
          <div className="text-muted-foreground">
            • Click anywhere to set plot location<br/>
            • Blue marker = Plot location<br/>
            • Colored dots = Existing devices<br/>
            • Scroll to zoom, drag to pan
          </div>
        </div>
      </div>

      {/* Location indicator */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-sm">
            <div className="font-semibold">Selected Location</div>
            <div className="font-mono text-xs">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
