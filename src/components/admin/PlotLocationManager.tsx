// Plot Location Manager for admin to set plot locations
import { useState, useCallback, useMemo } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Save, Search, Crosshair, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Suspense, lazy } from 'react';
import { Plot } from '@/types/device';

// Lazy load the interactive map
const InteractiveMap = lazy(() => import('./InteractiveMap'));

interface PlotLocationData {
  plotId: string;
  location: {
    lat: number;
    lng: number;
  } | null;
}

export function PlotLocationManager() {
  const { plots, devices, getPlotDevices } = useDevices();
  const { toast } = useToast();
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [plotLocations, setPlotLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved plot locations from localStorage
  useState(() => {
    const saved = localStorage.getItem('plot_locations');
    if (saved) {
      try {
        setPlotLocations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load plot locations:', e);
      }
    }
  });

  const selectedPlot = useMemo(() => 
    plots.find(p => p.id === selectedPlotId), 
    [plots, selectedPlotId]
  );

  const plotDevices = useMemo(() => 
    selectedPlotId ? getPlotDevices(selectedPlotId) : [],
    [selectedPlotId, getPlotDevices]
  );

  // Handle plot selection
  const handlePlotSelect = useCallback((plotId: string) => {
    setSelectedPlotId(plotId);
    const location = plotLocations[plotId];
    if (location) {
      setManualLat(location.lat.toString());
      setManualLng(location.lng.toString());
    } else {
      setManualLat('');
      setManualLng('');
    }
  }, [plotLocations]);

  // Handle manual coordinate input
  const handleManualCoordinateUpdate = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Invalid Coordinates',
        description: 'Please enter valid latitude and longitude values.',
        variant: 'destructive',
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: 'Invalid Range',
        description: 'Latitude must be between -90 and 90, longitude between -180 and 180.',
        variant: 'destructive',
      });
      return;
    }

    setPlotLocations(prev => ({
      ...prev,
      [selectedPlotId]: { lat, lng }
    }));

    toast({
      title: 'Location Updated',
      description: `Coordinates for ${selectedPlot?.name} have been updated.`,
    });
  }, [manualLat, manualLng, selectedPlotId, selectedPlot, toast]);

  // Handle map click to set location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!selectedPlotId) return;

    setPlotLocations(prev => ({
      ...prev,
      [selectedPlotId]: { lat, lng }
    }));
    
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));

    toast({
      title: 'Location Selected',
      description: `Coordinates for ${selectedPlot?.name} set from map.`,
    });
  }, [selectedPlotId, selectedPlot, toast]);

  // Save all plot locations
  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('plot_locations', JSON.stringify(plotLocations));
      
      // In a real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Locations Saved',
        description: `Successfully saved locations for ${Object.keys(plotLocations).length} plots.`,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save plot locations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [plotLocations, toast]);

  // Get current location (geolocation)
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setManualLat(latitude.toFixed(6));
        setManualLng(longitude.toFixed(6));
        
        toast({
          title: 'Location Found',
          description: 'Current location has been set. Click "Update Location" to apply.',
        });
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: 'Unable to get your current location.',
          variant: 'destructive',
        });
      }
    );
  }, [toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Plot Location Management
          </CardTitle>
          <CardDescription>
            Set and manage GPS coordinates for your agricultural plots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plot Selection */}
          <div className="space-y-2">
            <Label>Select Plot</Label>
            <Select value={selectedPlotId} onValueChange={handlePlotSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plot to manage its location" />
              </SelectTrigger>
              <SelectContent>
                {plots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    <div className="flex items-center gap-2">
                      <span>{plot.name}</span>
                      {plotLocations[plot.id] && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlot && (
            <div className="space-y-4">
              {/* Plot Info */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedPlot.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPlot.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {plotDevices.length} devices
                      </Badge>
                      {plotLocations[selectedPlotId] ? (
                        <Badge variant="default" className="bg-green-500">
                          Location Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          No Location
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Coordinates</TabsTrigger>
                  <TabsTrigger value="map">Map Selection</TabsTrigger>
                </TabsList>

                {/* Manual Coordinate Input */}
                <TabsContent value="manual" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 37.7749"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Range: -90 to 90
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., -122.4194"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Range: -180 to 180
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleManualCoordinateUpdate}
                      disabled={!selectedPlotId || !manualLat || !manualLng}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Update Location
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGetCurrentLocation}
                      className="gap-2"
                    >
                      <Crosshair className="h-4 w-4" />
                      Use Current Location
                    </Button>
                  </div>

                  {plotLocations[selectedPlotId] && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Current location: {plotLocations[selectedPlotId].lat.toFixed(6)}, {plotLocations[selectedPlotId].lng.toFixed(6)}
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Map Selection */}
                <TabsContent value="map" className="space-y-4">
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      Click on the map to set the plot location. The coordinates will be automatically filled in the manual input fields.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="rounded-lg border overflow-hidden" style={{ height: '400px' }}>
                    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading map...</div>}>
                      <InteractiveMap
                        onLocationSelect={handleMapClick}
                        initialLocation={plotLocations[selectedPlotId] || undefined}
                        plotDevices={plotDevices}
                      />
                    </Suspense>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!selectedPlot && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a plot to manage its location settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary and Save All */}
      {Object.keys(plotLocations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Location Summary</CardTitle>
            <CardDescription>
              {Object.keys(plotLocations).length} of {plots.length} plots have locations set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(plotLocations).map(([plotId, location]) => {
                const plot = plots.find(p => p.id === plotId);
                return plot ? (
                  <div key={plotId} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <span className="font-medium">{plot.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Set
                    </Badge>
                  </div>
                ) : null;
              })}
            </div>
            
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="w-full mt-4 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save All Locations'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
