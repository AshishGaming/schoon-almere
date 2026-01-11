import { useState, useMemo } from 'react';
import { BulkyWasteReport } from './ReportForm';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Filter, MapPin, Calendar, AlertCircle, Clock, Map as MapIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface UserReportsViewProps {
  reports: BulkyWasteReport[];
  onViewOnMap: (lat: number, lng: number) => void;
}

export function UserReportsView({ reports, onViewOnMap }: UserReportsViewProps) {
  const [activeTab, setActiveTab] = useState('gemeld');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Split reports by status
  const gemeldReports = reports.filter(r => r.status === 'gemeld');
  const inBehandelingReports = reports.filter(r => r.status === 'in_behandeling');

  // Get current tab's reports
  const currentTabReports = activeTab === 'gemeld' ? gemeldReports : inBehandelingReports;

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(currentTabReports.map(r => r.type));
    return Array.from(types).sort();
  }, [currentTabReports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = currentTabReports;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.address.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        return filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'date-asc':
        return filtered.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      default:
        return filtered;
    }
  }, [currentTabReports, searchTerm, typeFilter, sortBy]);

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

  const renderReportList = (reportList: typeof filteredReports) => (
    <>
      {/* Search and Filters */}
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {reportList.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 sm:py-20 text-center text-gray-500">
            <Filter className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300">Geen meldingen gevonden</p>
            <p className="text-sm sm:text-base mt-2">
              {searchTerm ? 'Pas je zoekopdracht aan om andere resultaten te zien' : 'Er zijn geen meldingen in deze categorie'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {reportList.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 sm:p-6">
                <div className="flex gap-4 sm:gap-5">
                  {report.photo && (
                    <img
                      src={report.photo}
                      alt={report.type}
                      className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl flex-shrink-0 shadow-md"
                    />
                  )}
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">{report.type}</h3>
                      {getStatusBadge(report.status)}
                    </div>

                    {report.description && (
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 space-y-2">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-500" />
                        <span className="font-medium">Adres:</span> {report.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-500" />
                        <span className="font-medium">Gemeld op:</span>{' '}
                        {format(report.createdAt, "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => onViewOnMap(report.location.lat, report.location.lng)}
                      className="gap-2 mt-3 h-11 sm:h-12 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-500 hover:border-green-500"
                    >
                      <MapIcon className="h-4 w-4" />
                      Bekijk op kaart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="px-1">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Actieve Meldingen</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Bekijk alle gemelde en behandelde grofvuil meldingen
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <TabsTrigger 
            value="gemeld" 
            className="flex flex-col gap-1.5 py-4 sm:py-5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-b-yellow-500 data-[state=active]:[&>*]:text-yellow-600 dark:data-[state=active]:[&>*]:text-yellow-500"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-semibold text-sm sm:text-base">Gemeld</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{gemeldReports.length}</div>
          </TabsTrigger>
          <TabsTrigger 
            value="in_behandeling" 
            className="flex flex-col gap-1.5 py-4 sm:py-5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500 data-[state=active]:[&>*]:text-blue-600 dark:data-[state=active]:[&>*]:text-blue-500"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-semibold text-sm sm:text-base">In Behandeling</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{inBehandelingReports.length}</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gemeld" className="mt-6">
          {renderReportList(filteredReports)}
        </TabsContent>

        <TabsContent value="in_behandeling" className="mt-6">
          {renderReportList(filteredReports)}
        </TabsContent>
      </Tabs>
    </div>
  );
}