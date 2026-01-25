import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon } from 'lucide-react';

interface InteractiveMapProps {
    onLocationSelect?: (lat: number, lng: number) => void;
    initialLocation?: { lat: number; lng: number };
    plotDevices?: Device[];
}

// Custom icon for the selected/initial location
const createSelectionIcon = () => {
    return L.divIcon({
        className: 'selection-marker',
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
                animation: bounce 2s infinite;
            ">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            </div>
            <style>
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            </style>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const createDeviceIcon = () => {
    return L.divIcon({
        className: 'device-marker',
        html: `<div style="width: 12px; height: 12px; background: #22c55e; border: 2px solid white; border-radius: 50%;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
};

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect?.(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function InitialViewHandler({ location }: { location?: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.setView([location.lat, location.lng], 13);
        }
    }, [location, map]);
    return null;
}

export default function InteractiveMap({ onLocationSelect, initialLocation, plotDevices }: InteractiveMapProps) {
    const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
    const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(initialLocation || null);

    useEffect(() => {
        if (initialLocation) {
            setMarkerPos(initialLocation);
        }
    }, [initialLocation]);

    const handleMapClick = (lat: number, lng: number) => {
        setMarkerPos({ lat, lng });
        onLocationSelect?.(lat, lng);
    };

    const defaultCenter: [number, number] = initialLocation ? [initialLocation.lat, initialLocation.lng] : [37.7749, -122.4194];

    return (
        <div className="relative h-full w-full">
            <div className="absolute top-2 right-2 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                <Button
                    size="sm"
                    variant={mapType === 'street' ? 'default' : 'ghost'}
                    onClick={() => setMapType('street')}
                    className="h-7 px-2 text-[10px]"
                >
                    <MapIcon className="h-3 w-3 mr-1" />
                    Street
                </Button>
                <Button
                    size="sm"
                    variant={mapType === 'satellite' ? 'default' : 'ghost'}
                    onClick={() => setMapType('satellite')}
                    className="h-7 px-2 text-[10px]"
                >
                    <Satellite className="h-3 w-3 mr-1" />
                    Satellite
                </Button>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution={mapType === 'street'
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        : '&copy; <a href="https://www.esri.com/">Esri</a>'
                    }
                    url={mapType === 'street'
                        ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    }
                />

                <MapClickHandler onLocationSelect={handleMapClick} />
                <InitialViewHandler location={initialLocation} />

                {markerPos && (
                    <Marker position={[markerPos.lat, markerPos.lng]} icon={createSelectionIcon()} />
                )}

                {plotDevices?.filter(d => d.location).map(device => (
                    <Marker
                        key={device.id}
                        position={[device.location!.lat, device.location!.lng]}
                        icon={createDeviceIcon()}
                    />
                ))}
            </MapContainer>
        </div>
    );
}
