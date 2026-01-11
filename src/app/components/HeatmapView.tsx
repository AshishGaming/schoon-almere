import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTheme } from './ThemeContext';
import 'leaflet/dist/leaflet.css';

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

export function HeatmapView({ hotspots, maxCount }: HeatmapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const { theme } = useTheme();

  const getHeatmapColor = (count: number): string => {
    const intensity = count / maxCount;
    
    if (intensity >= 0.7) return '#ef4444'; // red
    if (intensity >= 0.4) return '#f97316'; // orange
    return '#fbbf24'; // yellow
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        center: [52.3676, 5.2144],
        zoom: 12,
        maxBounds: [
          [52.2856, 5.0644],
          [52.4496, 5.3644]
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
      });

      const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletMapRef.current);
    }

    return () => {
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

  // Update markers when hotspots change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    hotspots.forEach((hotspot) => {
      const radius = 10 + (hotspot.count / maxCount) * 20;
      const color = getHeatmapColor(hotspot.count);

      const circle = L.circleMarker([hotspot.lat, hotspot.lng], {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6,
      });

      circle.bindPopup(`
        <div style="padding: 4px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${hotspot.location}</p>
          <p style="margin: 0; font-size: 14px;">${hotspot.count} ${hotspot.count === 1 ? 'melding' : 'meldingen'}</p>
        </div>
      `);

      circle.addTo(leafletMapRef.current!);
      markersRef.current.push(circle);
    });
  }, [hotspots, maxCount]);

  return (
    <div 
      ref={mapRef} 
      className="h-full w-full"
      style={{ minHeight: '320px' }}
    />
  );
}
