import { useState, useMemo } from 'react';
import { BulkyWasteReport } from './ReportForm';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, MapPin, Calendar, Navigation, List, Map as MapIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ActiveReportsViewProps {
  reports: BulkyWasteReport[];
  onStatusUpdate?: (id: string, status: 'gemeld' | 'in_behandeling' | 'opgehaald') => void;
  userLocation?: { lat: number; lng: number } | null;
  canUpdateStatus?: boolean;
  showMapView?: boolean;
}

export function ActiveReportsView({ 
  reports, 
  onStatusUpdate, 
  userLocation,
  canUpdateStatus = false,
  showMapView = true
}: ActiveReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showNearby, setShowNearby] = useState(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(reports.map(r => r.type));
    return Array.from(types).sort();
  }, [reports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.address.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    // Nearby filter (within 2km)
    if (showNearby && userLocation) {
      filtered = filtered.filter(r => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          r.location.lat,
          r.location.lng
        );
        return distance <= 2; // 2km radius
      });
    }

    // Calculate distance for each report if user location is available
    const reportsWithDistance = filtered.map(r => ({
      ...r,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng)
        : null
    }));

    // Sort
    switch (sortBy) {
      case 'date-desc':
        return reportsWithDistance.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'date-asc':
        return reportsWithDistance.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'distance':
        if (!userLocation) return reportsWithDistance;
        return reportsWithDistance.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
      default:
        return reportsWithDistance;
    }
  }, [reports, searchTerm, statusFilter, typeFilter, sortBy, showNearby, userLocation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'gemeld':
        return <Badge className="bg-yellow-500 text-white">Gemeld</Badge>;
      case 'in_behandeling':
        return <Badge className="bg-blue-500 text-white">In behandeling</Badge>;
      case 'opgehaald':
        return <Badge className="bg-green-500 text-white">Opgehaald</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Zoek op adres of type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-auto min-w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="gemeld">Gemeld</SelectItem>
              <SelectItem value="in_behandeling">In behandeling</SelectItem>
              <SelectItem value="opgehaald">Opgehaald</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-auto min-w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 w-auto min-w-[140px]">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Nieuwste</SelectItem>
              <SelectItem value="date-asc">Oudste</SelectItem>
              {userLocation && (
                <SelectItem value="distance">Dichtsbij</SelectItem>
              )}
            </SelectContent>
          </Select>

          {userLocation && (
            <Button
              onClick={() => setShowNearby(!showNearby)}
              variant={showNearby ? "default" : "outline"}
              className="h-10 px-4"
            >
              <Navigation className="h-4 w-4 mr-2" />
              In de buurt
            </Button>
          )}

          {showMapView && (
            <div className="flex gap-2 ml-auto">
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'outline'}
                className="h-10"
                size="sm"
              >
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Lijst</span>
              </Button>
              <Button
                onClick={() => setViewMode('map')}
                variant={viewMode === 'map' ? 'default' : 'outline'}
                className="h-10"
                size="sm"
              >
                <MapIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Kaart</span>
              </Button>
            </div>
          )}
        </div>

        {/* Results counter */}
        <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <strong>{filteredReports.length}</strong> {filteredReports.length === 1 ? 'melding' : 'meldingen'} gevonden
        </div>
      </div>

      {/* Results */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen meldingen gevonden</p>
            <p className="text-sm mt-2">Pas je filters aan om andere resultaten te zien</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                  {/* Photo */}
                  {report.photo && (
                    <img
                      src={report.photo}
                      alt={report.type}
                      className="w-full md:w-32 h-32 object-cover rounded"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{report.type}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {report.address}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.createdAt), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                      </div>
                      {report.distance !== null && report.distance !== undefined && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {report.distance < 1 
                            ? `${Math.round(report.distance * 1000)}m`
                            : `${report.distance.toFixed(1)}km`
                          } verderop
                        </div>
                      )}
                      {!report.isAnonymous && report.userName && (
                        <div>Door: {report.userName}</div>
                      )}
                    </div>

                    {/* Status Update Buttons */}
                    {canUpdateStatus && onStatusUpdate && report.status !== 'opgehaald' && (
                      <div className="flex gap-2 pt-2">
                        {report.status === 'gemeld' && (
                          <Button
                            onClick={() => onStatusUpdate(report.id, 'in_behandeling')}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Start behandeling
                          </Button>
                        )}
                        {report.status === 'in_behandeling' && (
                          <Button
                            onClick={() => onStatusUpdate(report.id, 'opgehaald')}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Markeer als opgehaald
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={[52.3676, 5.2233]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            maxBounds={[[52.25, 5.05], [52.50, 5.40]]}
            maxBoundsViscosity={1.0}
            minZoom={11}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredReports.map((report) => (
              <Marker key={report.id} position={[report.location.lat, report.location.lng]}>
                <Popup>
                  <div style={{ fontSize: '12px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{report.type}</p>
                    <p style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{report.address}</p>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        backgroundColor: report.status === 'gemeld' ? '#eab308' :
                          report.status === 'in_behandeling' ? '#3b82f6' : '#22c55e',
                        color: 'white'
                      }}>
                        {report.status === 'gemeld' ? 'Gemeld' :
                         report.status === 'in_behandeling' ? 'In behandeling' : 'Opgehaald'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {userLocation && (
              <Marker 
                position={[userLocation.lat, userLocation.lng]}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}>
                <Popup>
                  <div style={{ fontSize: '12px' }}>
                    <p style={{ fontWeight: 'bold' }}>Jouw locatie</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}