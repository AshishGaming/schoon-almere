import { useState, useMemo } from 'react';
import { BulkyWasteReport } from "./ReportForm";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BarChart3, Users, AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, Database } from "lucide-react";
import { HeatmapView } from './HeatmapView';
import { HeatmapViewImproved } from './HeatmapViewImproved';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { generateSampleReports } from '../utils/generateSampleData';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface AdminDashboardProps {
  reports: BulkyWasteReport[];
  onRefresh: () => void;
  accessToken?: string;
}

interface Hotspot {
  location: string;
  count: number;
  lat: number;
  lng: number;
}

export function AdminDashboard({ reports, onRefresh, accessToken }: AdminDashboardProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadSampleData = async () => {
    if (!accessToken) {
      toast.error("Niet ingelogd");
      return;
    }

    setIsLoading(true);
    try {
      const sampleReports = Array.from({ length: 50 }, (_, i) => {
        const lat = 52.35 + (Math.random() * 0.05);
        const lng = 5.20 + (Math.random() * 0.10);
        
        return {
          id: `report:sample-${Date.now()}-${i}`,
          type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          location: { lat, lng },
          address: addresses[Math.floor(Math.random() * addresses.length)],
          photo: photos[Math.floor(Math.random() * photos.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          userId: `user-${Math.floor(Math.random() * 10)}`,
          userName: names[Math.floor(Math.random() * names.length)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      });
      
      const response = await fetch(`${API_BASE_URL}/reports/load-sample-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
          "X-User-Token": accessToken,
        },
        body: JSON.stringify({ sampleReports }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("API error response:", error);
        throw new Error(error.error || error.details || "Failed to load sample data");
      }
      
      const result = await response.json();
      toast.success(`${result.count} sample meldingen geladen!`);
      
      // Refresh data
      setTimeout(() => {
        onRefresh();
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast.error("Fout bij laden van sample data: " + (error as Error).message);
      setIsLoading(false);
    }
  };

  const stats = {
    total: reports.length,
    gemeld: reports.filter(r => r.status === "gemeld").length,
    inBehandeling: reports.filter(r => r.status === "in_behandeling").length,
    opgehaald: reports.filter(r => r.status === "opgehaald").length,
  };

  // Calculate average resolution time
  const completedReports = reports.filter(r => r.status === "opgehaald" && r.updatedAt);
  const avgResolutionTime = useMemo(() => {
    if (completedReports.length === 0) return null;
    
    const totalHours = completedReports.reduce((sum, report) => {
      const created = new Date(report.createdAt);
      const updated = new Date(report.updatedAt!);
      return sum + differenceInHours(updated, created);
    }, 0);
    
    const avgHours = totalHours / completedReports.length;
    
    // Format tijd op basis van duur
    if (avgHours < 1) {
      const minutes = Math.round(avgHours * 60);
      return { display: `${minutes}m`, description: `${minutes} minuten` };
    } else if (avgHours < 24) {
      const hours = Math.round(avgHours);
      return { display: `${hours}u`, description: `${hours} uur` };
    } else if (avgHours < 24 * 7) {
      const days = Math.round(avgHours / 24);
      const hours = Math.round(avgHours % 24);
      return { 
        display: hours > 0 ? `${days}d ${hours}u` : `${days}d`, 
        description: `${days} dagen${hours > 0 ? ` en ${hours} uur` : ''}` 
      };
    } else {
      const weeks = Math.floor(avgHours / (24 * 7));
      const days = Math.round((avgHours % (24 * 7)) / 24);
      return { 
        display: days > 0 ? `${weeks}w ${days}d` : `${weeks}w`, 
        description: `${weeks} weken${days > 0 ? ` en ${days} dagen` : ''}` 
      };
    }
  }, [completedReports]);

  // Helper function to extract street name from address
  const getStreetName = (address: string): string => {
    // Remove house number and everything after it
    // Patterns: "30, Lastdragerstraat" -> "Lastdragerstraat"
    //           "De Nieuwe Bibliotheek" -> "De Nieuwe Bibliotheek" (no change)
    const parts = address.split(',');
    if (parts.length > 1) {
      // If there's a comma, take the part after the comma (the street name)
      return parts[1].trim();
    }
    // Otherwise, try to remove numbers at the start
    const cleaned = address.replace(/^\d+[a-z]?\s*,?\s*/i, '').trim();
    return cleaned || address;
  };

  // Calculate hotspots
  const hotspots = useMemo(() => {
    const locationMap = new Map<string, { count: number; lat: number; lng: number }>();
    
    reports.forEach(report => {
      const streetName = getStreetName(report.address);
      if (locationMap.has(streetName)) {
        const existing = locationMap.get(streetName)!;
        locationMap.set(streetName, { ...existing, count: existing.count + 1 });
      } else {
        locationMap.set(streetName, {
          count: 1,
          lat: report.location.lat,
          lng: report.location.lng,
        });
      }
    });
    
    const hotspotArray: Hotspot[] = Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        count: data.count,
        lat: data.lat,
        lng: data.lng,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return hotspotArray;
  }, [reports]);

  // Get heatmap color based on count
  const getHeatmapColor = (count: number, maxCount: number): string => {
    const intensity = count / maxCount;
    
    if (intensity >= 0.7) return '#ef4444'; // red
    if (intensity >= 0.4) return '#f97316'; // orange
    return '#fbbf24'; // yellow/white
  };

  const maxHotspotCount = hotspots.length > 0 ? hotspots[0].count : 1;

  // Report types distribution (Top 5)
  const typeDistribution = useMemo(() => {
    const types = new Map<string, number>();
    reports.forEach(report => {
      types.set(report.type, (types.get(report.type) || 0) + 1);
    });
    return Array.from(types.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 meest voorkomende types
  }, [reports]);

  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Uitgebreid overzicht van alle grofvuil meldingen en statistieken
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totaal Meldingen
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              Alle meldingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nieuwe Meldingen
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gemeld}</div>
            <p className="text-xs text-gray-500 mt-1">
              Wacht op behandeling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Behandeling
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inBehandeling}</div>
            <p className="text-xs text-gray-500 mt-1">
              Wordt opgehaald
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Afgerond
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opgehaald}</div>
            <p className="text-xs text-gray-500 mt-1">
              Succesvol opgehaald
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gemiddelde Tijd
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResolutionTime ? (
                <>
                  {avgResolutionTime.display}
                </>
              ) : (
                '-'
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Van melding tot ophalen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hotspots with Heatmap Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hotspot List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Meest voorkomende locaties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotspots.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nog geen locaties</p>
            ) : (
              <div className="space-y-3">
                {hotspots.map((hotspot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                        ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-yellow-500' : 'bg-gray-400'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{hotspot.location}</p>
                      </div>
                    </div>
                    <Badge
                      className={`
                        ${index === 0 ? 'bg-red-500 hover:bg-red-600' : 
                          index === 1 ? 'bg-orange-500 hover:bg-orange-600' : 
                          index === 2 ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 
                          'bg-gray-400 hover:bg-gray-500'} 
                        text-white font-bold px-3 py-1 text-base flex-shrink-0 ml-3
                      `}
                      style={index === 2 ? { color: '#111827' } : {}}
                    >
                      {hotspot.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Heatmap Weergave
              </CardTitle>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {showHeatmap ? 'Verberg' : 'Toon'} kaart
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {showHeatmap ? (
              <HeatmapViewImproved
                hotspots={hotspots}
                maxCount={maxHotspotCount}
              />
            ) : (
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Klik op "Toon kaart" om de heatmap te bekijken</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Laag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Gemiddeld</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Hoog</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Meest Voorkomende Types</CardTitle>
        </CardHeader>
        <CardContent>
          {typeDistribution.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nog geen data</p>
          ) : (
            <div className="space-y-3">
              {typeDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm font-medium">
                      {item.count} ({stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Verdeling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Gemeld</span>
                <span className="text-sm font-medium">
                  {stats.gemeld} ({stats.total > 0 ? Math.round((stats.gemeld / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.gemeld / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">In Behandeling</span>
                <span className="text-sm font-medium">
                  {stats.inBehandeling} ({stats.total > 0 ? Math.round((stats.inBehandeling / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.inBehandeling / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Opgehaald</span>
                <span className="text-sm font-medium">
                  {stats.opgehaald} ({stats.total > 0 ? Math.round((stats.opgehaald / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.opgehaald / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Meldingen</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nog geen meldingen</p>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {report.photo && (
                      <img
                        src={report.photo}
                        alt={report.type}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{report.type}</p>
                      <p className="text-sm text-gray-500">{report.address}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(report.createdAt), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      report.status === "gemeld"
                        ? "bg-yellow-500 text-white"
                        : report.status === "in_behandeling"
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
                    }
                  >
                    {report.status === "gemeld"
                      ? "Gemeld"
                      : report.status === "in_behandeling"
                      ? "In behandeling"
                      : "Opgehaald"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load Sample Data Button */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Laden</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={loadSampleData}
            className="bg-blue-500 text-white hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Laden..." : "Sample Meldingen Laden"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}