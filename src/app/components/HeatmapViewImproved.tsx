import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useTheme } from './ThemeContext';

interface Hotspot {
  location: string;
  count: number;
  lat: number;
  lng: number;
}

interface HeatmapViewProps {
  hotspots: Hotspot[];
  maxCount: number;
}

export function HeatmapViewImproved({ hotspots, maxCount }: HeatmapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        maxBounds: [
          [52.25, 5.05], // Southwest corner of Almere
          [52.50, 5.40]  // Northeast corner of Almere
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
      }).setView([52.3676, 5.2233], 12);

      // Apply theme-aware tile layer
      const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMapRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (heatLayerRef.current && leafletMapRef.current) {
        leafletMapRef.current.removeLayer(heatLayerRef.current);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!leafletMapRef.current || !tileLayerRef.current) return;

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Update heatmap when hotspots change
  useEffect(() => {
    if (!leafletMapRef.current || !hotspots.length) return;

    // Remove old heat layer
    if (heatLayerRef.current) {
      leafletMapRef.current.removeLayer(heatLayerRef.current);
    }

    // Convert hotspots to heatmap data [lat, lng, intensity]
    const heatData: [number, number, number][] = hotspots.map(hotspot => [
      hotspot.lat,
      hotspot.lng,
      hotspot.count / maxCount // Intensity per point
    ]);

    // Function to update heatmap based on zoom level
    const updateHeatmapIntensity = () => {
      if (!leafletMapRef.current || !heatLayerRef.current) return;
      
      const zoom = leafletMapRef.current.getZoom();
      // Higher intensity when zoomed out (lower zoom), lower when zoomed in
      // Zoom range: 11-18, so we invert the intensity
      const intensityFactor = 1.5 - ((zoom - 11) / 7) * 0.9; // Range: 1.5 at zoom 11 → 0.6 at zoom 18
      
      heatLayerRef.current.setOptions({
        max: 0.4 * intensityFactor, // More intense when zoomed out
        minOpacity: 0.5 + (1.5 - intensityFactor) * 0.2 // Higher opacity when zoomed out
      });
    };

    // Create new heat layer with gradient: white → yellow → orange → red
    heatLayerRef.current = (L as any).heatLayer(heatData, {
      radius: 35, // Larger radius for more visible effect
      blur: 25,
      maxZoom: 18, // Changed to match map maxZoom
      max: 0.4, // Lower max value = higher intensity
      minOpacity: 0.5, // Minimum opacity to ensure visibility
      // Gradient from white to yellow, orange, dark red (more intense colors)
      gradient: {
        0.0: '#ffffff00', // Transparent at edges
        0.15: '#ffff66',  // Bright yellow
        0.35: '#ffcc00',  // Golden yellow
        0.50: '#ff9900',  // Bright orange
        0.70: '#ff6600',  // Dark orange
        0.85: '#ff3300',  // Red-orange
        1.0: '#cc0000'    // Dark red
      }
    }).addTo(leafletMapRef.current);

    // Add zoom event listener to adjust intensity
    leafletMapRef.current.on('zoomend', updateHeatmapIntensity);
    
    // Set initial intensity based on current zoom
    updateHeatmapIntensity();

    // Cleanup zoom listener
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off('zoomend', updateHeatmapIntensity);
      }
    };
  }, [hotspots, maxCount]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ minHeight: "600px" }}
    />
  );
}