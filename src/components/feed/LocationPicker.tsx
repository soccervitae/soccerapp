import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LocationPickerProps {
  initialLocation?: { name: string; lat: number; lng: number } | null;
  onConfirm: (location: { name: string; lat: number; lng: number }) => void;
  onCancel: () => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHRzNjRkNjgwMW9qMmtvNnUzZXYyN3BoIn0.a0PL5fG59m5xS1P3k6nqaQ";

export const LocationPicker = ({ initialLocation, onConfirm, onCancel }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingName, setIsLoadingName] = useState(false);

  // Reverse geocoding to get place name
  const getPlaceName = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Error getting place name:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Forward geocoding search
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Error searching locations:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else if (map.current) {
      marker.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
    
    setIsLoadingName(true);
    const placeName = await getPlaceName(lat, lng);
    setSelectedLocation({ name: placeName, lat, lng });
    setIsLoadingName(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [getPlaceName]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const initialCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] 
      : [-47.9292, -15.7801]; // Brasília, Brazil
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialLocation ? 14 : 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("click", handleMapClick);

    // Add initial marker if location exists
    if (initialLocation) {
      marker.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initialLocation, handleMapClick]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Handle search result selection
  const handleSelectResult = async (result: SearchResult) => {
    const [lng, lat] = result.center;
    
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 14 });
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    }
    
    setSelectedLocation({ name: result.place_name, lat, lng });
    setSearchQuery("");
    setSearchResults([]);
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    toast.loading("Obtendo localização...", { id: "getting-location" });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 14 });
          
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          } else {
            marker.current = new mapboxgl.Marker({ color: "#ef4444" })
              .setLngLat([lng, lat])
              .addTo(map.current);
          }
        }
        
        const placeName = await getPlaceName(lat, lng);
        setSelectedLocation({ name: placeName, lat, lng });
        toast.dismiss("getting-location");
        toast.success("Localização obtida!");
      },
      (error) => {
        toast.dismiss("getting-location");
        console.error("Error getting location:", error);
        toast.error("Não foi possível obter sua localização");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      toast.error("Selecione uma localização no mapa");
      return;
    }
    onConfirm(selectedLocation);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button 
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[24px] text-foreground">close</span>
        </button>
        
        <span className="text-base font-semibold text-foreground">Adicionar Local</span>
        
        <Button 
          onClick={handleConfirm}
          size="sm"
          variant="ghost"
          className="text-primary font-semibold text-sm hover:bg-transparent"
          disabled={!selectedLocation}
        >
          Confirmar
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border relative">
        <div className="relative">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <Input
            placeholder="Buscar local..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">close</span>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[20px] text-muted-foreground mt-0.5">
                  location_on
                </span>
                <span className="text-sm text-foreground line-clamp-2">{result.place_name}</span>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Current Location Button */}
      <div className="px-4 py-2 border-b border-border">
        <button
          onClick={handleGetCurrentLocation}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-primary">my_location</span>
          </div>
          <span className="text-sm font-medium text-foreground">Usar minha localização atual</span>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Selected Location */}
      {selectedLocation && (
        <div className="px-4 py-4 border-t border-border bg-background">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] text-destructive">location_on</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Local selecionado</p>
              {isLoadingName ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground line-clamp-2">{selectedLocation.name}</p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null);
                if (marker.current) {
                  marker.current.remove();
                  marker.current = null;
                }
              }}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
