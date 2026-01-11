import { useState } from 'react';
import { BulkyWasteReport } from "./ReportForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ActiveReportsView } from './ActiveReportsView';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface WorkerDashboardProps {
  reports: BulkyWasteReport[];
  onStatusChange: (reportId: string, newStatus: BulkyWasteReport["status"]) => void;
  onViewOnMap: (lat: number, lng: number) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function WorkerDashboard({ reports, onStatusChange, onViewOnMap, userLocation }: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState('gemeld');

  // Split reports by status
  const gemeldReports = reports.filter(r => r.status === 'gemeld');
  const inBehandelingReports = reports.filter(r => r.status === 'in_behandeling');
  const opgehaaldReports = reports.filter(r => r.status === 'opgehaald');

  const handleStatusUpdate = (id: string, status: 'gemeld' | 'in_behandeling' | 'opgehaald') => {
    onStatusChange(id, status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Beheer Meldingen</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Bekijk en beheer grofvuil meldingen per status
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <TabsTrigger 
            value="gemeld" 
            className="flex flex-col gap-1 py-3 sm:py-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-b-yellow-500"
          >
            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-xs sm:text-sm">Gemeld</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{gemeldReports.length}</div>
          </TabsTrigger>
          <TabsTrigger 
            value="in_behandeling" 
            className="flex flex-col gap-1 py-3 sm:py-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500"
          >
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-xs sm:text-sm">Behandeling</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{inBehandelingReports.length}</div>
          </TabsTrigger>
          <TabsTrigger 
            value="opgehaald" 
            className="flex flex-col gap-1 py-3 sm:py-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-b-green-500"
          >
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-xs sm:text-sm">Opgehaald</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{opgehaaldReports.length}</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gemeld" className="mt-6">
          <ActiveReportsView
            reports={gemeldReports}
            onStatusUpdate={handleStatusUpdate}
            userLocation={userLocation}
            canUpdateStatus={true}
            showMapView={false}
          />
        </TabsContent>

        <TabsContent value="in_behandeling" className="mt-6">
          <ActiveReportsView
            reports={inBehandelingReports}
            onStatusUpdate={handleStatusUpdate}
            userLocation={userLocation}
            canUpdateStatus={true}
            showMapView={false}
          />
        </TabsContent>

        <TabsContent value="opgehaald" className="mt-6">
          <ActiveReportsView
            reports={opgehaaldReports}
            userLocation={userLocation}
            canUpdateStatus={false}
            showMapView={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}