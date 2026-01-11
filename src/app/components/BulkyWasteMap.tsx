import { useEffect, useRef } from "react";
import L from "leaflet";
import { BulkyWasteReport } from "./ReportForm";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useTheme } from "./ThemeContext";

// Fix voor standaard Leaflet marker iconen
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface BulkyWasteMapProps {
  reports: BulkyWasteReport[];
  center?: [number, number];
  zoom?: number;
}

export function BulkyWasteMap({ 
  reports, 
  center = [52.3676, 5.2144], // Almere centrum als standaard
  zoom = 13 
}: BulkyWasteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  const getStatusColor = (status: BulkyWasteReport["status"]) => {
    switch (status) {
      case "gemeld":
        return "#eab308"; // yellow-500
      case "in_behandeling":
        return "#3b82f6"; // blue-500
      case "opgehaald":
        return "#22c55e"; // green-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  const getStatusLabel = (status: BulkyWasteReport["status"]) => {
    switch (status) {
      case "gemeld":
        return "Gemeld";
      case "in_behandeling":
        return "In behandeling";
      case "opgehaald":
        return "Opgehaald";
      default:
        return status;
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        maxBounds: [
          [52.2856, 5.0644], // Southwest corner of Almere
          [52.4496, 5.3644]  // Northeast corner of Almere
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
      }).setView(center, zoom);

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

  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Update map view when center or zoom changes
    leafletMapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      const marker = L.marker([report.location.lat, report.location.lng]);
      
      const statusColor = getStatusColor(report.status);
      const statusLabel = getStatusLabel(report.status);
      
      const popupContent = `
        <div style="min-width: 250px;">
          <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
            <h3 style="font-weight: 600; font-size: 16px; margin: 0;">${report.type}</h3>
            <span style="background-color: ${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap;">
              ${statusLabel}
            </span>
          </div>
          ${report.description ? `
            <p style="font-size: 14px; color: #4b5563; margin: 8px 0;">
              ${report.description}
            </p>
          ` : ''}
          ${report.photo ? `
            <img 
              src="${report.photo}" 
              alt="${report.type}" 
              style="width: 100%; height: 128px; object-fit: cover; border-radius: 4px; margin: 8px 0;"
            />
          ` : ''}
          <div style="font-size: 12px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 4px 0;">
              <strong>Adres:</strong> ${report.address}
            </p>
            <p style="margin: 4px 0;">
              <strong>Gemeld op:</strong> ${format(report.createdAt, "d MMMM yyyy 'om' HH:mm", { locale: nl })}
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(leafletMapRef.current!);
      markersRef.current.push(marker);
    });
  }, [reports]);

  return (
    <div 
      ref={mapRef} 
      className="h-full w-full z-0"
      style={{ minHeight: "400px" }}
    />
  );
}