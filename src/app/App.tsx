import { useState, useEffect } from "react";
import { BulkyWasteMap } from "./components/BulkyWasteMap";
import { ReportForm, BulkyWasteReport } from "./components/ReportForm";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./components/ui/sheet";
import { Toaster } from "./components/ui/sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { LoginForm } from "./components/LoginForm";
import { WorkerDashboard } from "./components/WorkerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { SettingsView } from "./components/SettingsView";
import { UserReportsView } from "./components/UserReportsView";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { AppTour } from "./components/AppTour";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { FloatingActionButton } from "./components/FloatingActionButton";
import { MobileHeader } from "./components/MobileHeader";
import { DesktopNav } from "./components/DesktopNav";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2f5e78e8`;

// Calculate distance between two points in meters using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function AppContent() {
  const { user, setUser, session, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [reports, setReports] = useState<BulkyWasteReport[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.3676, 4.9041]);
  const [activeTab, setActiveTab] = useState("meldingen");
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('welcomeCompleted');
  });
  const [showTour, setShowTour] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user's current location on app load
  useEffect(() => {
    if (isAuthenticated && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Check if location is within Almere bounds (roughly)
          const isInAlmere = 
            latitude >= 52.30 && latitude <= 52.44 &&
            longitude >= 5.10 && longitude <= 5.35;
          
          if (isInAlmere) {
            setUserLocation([latitude, longitude]);
            setMapCenter([latitude, longitude]);
          } else {
            // Still save location but don't center map
            setUserLocation([latitude, longitude]);
          }
        },
        (error) => {
          console.warn("Could not get user location:", error.message);
          // Keep default Almere center
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  }, [isAuthenticated]);

  // Check if tour should be shown after login
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('tourCompleted')) {
      // Small delay to let the UI render first
      setTimeout(() => setShowTour(true), 500);
    }
  }, [isAuthenticated]);

  // Fetch reports when authenticated
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    fetchReports();
  }, [isAuthenticated, session]);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      // Als lokale sessie, gebruik localStorage
      if (session && session.access_token.startsWith("local-token-")) {
        const savedReports = localStorage.getItem("reports");
        if (savedReports) {
          const parsedReports = JSON.parse(savedReports).map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
          }));
          setReports(parsedReports);
        }
        setIsLoadingReports(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      
      // Fallback naar lokale opslag bij server error
      if (error instanceof TypeError) {
        console.warn("Server niet bereikbaar, gebruik lokale opslag");
        const savedReports = localStorage.getItem("reports");
        if (savedReports) {
          const parsedReports = JSON.parse(savedReports).map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
          }));
          setReports(parsedReports);
        }
      } else {
        toast.error("Er is een fout opgetreden bij het ophalen van meldingen.");
      }
    } finally {
      setIsLoadingReports(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen if first time user (before login)
  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleSubmitReport = async (
    newReport: Omit<BulkyWasteReport, "id" | "createdAt" | "status">
  ) => {
    try {
      // Check for nearby reports (within 10 meters) - anti-spam
      const SPAM_RADIUS_METERS = 10;
      const nearbyReports = reports.filter(r => {
        const distance = calculateDistance(
          newReport.location.lat,
          newReport.location.lng,
          r.location.lat,
          r.location.lng
        );
        return distance < SPAM_RADIUS_METERS;
      });

      if (nearbyReports.length > 0) {
        toast.error(`Er is al een melding binnen ${SPAM_RADIUS_METERS} meter van deze locatie. Kies een andere locatie.`);
        return;
      }

      // Check rate limiting - max 5 reports per hour per user
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentReports = reports.filter(r => {
        const isSameUser = user ? r.userId === user.id : r.userId === "anon";
        return isSameUser && new Date(r.createdAt) > oneHourAgo;
      });

      if (recentReports.length >= 5) {
        toast.error("Je hebt het maximum aantal meldingen per uur bereikt. Probeer het later opnieuw.");
        return;
      }

      // Als lokale sessie, gebruik localStorage
      if (session?.access_token.startsWith("local-token-")) {
        const reportId = `report:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const report: BulkyWasteReport = {
          id: reportId,
          ...newReport,
          userId: user?.id || "anon",
          userName: user?.name || "Anonieme Gebruiker",
          status: "gemeld",
          createdAt: new Date(),
        };

        const updatedReports = [report, ...reports];
        setReports(updatedReports);
        localStorage.setItem("reports", JSON.stringify(updatedReports));
        
        setMapCenter([newReport.location.lat, newReport.location.lng]);
        setViewMode("map");
        toast.success("Melding succesvol aangemaakt!");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(newReport),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to create report");
      }

      const data = await response.json();
      const report = {
        ...data.report,
        createdAt: new Date(data.report.createdAt),
      };

      setReports([report, ...reports]);
      setMapCenter([newReport.location.lat, newReport.location.lng]);
      setViewMode("map");
      toast.success("Melding succesvol aangemaakt!");
    } catch (error) {
      console.error("Error creating report:", error);
      
      // Fallback naar lokale opslag bij server error
      if (error instanceof TypeError) {
        console.warn("Server niet bereikbaar, opslaan in lokale opslag");
        const reportId = `report:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const report: BulkyWasteReport = {
          id: reportId,
          ...newReport,
          userId: user?.id || "anon",
          userName: user?.name || "Anonieme Gebruiker",
          status: "gemeld",
          createdAt: new Date(),
        };

        const updatedReports = [report, ...reports];
        setReports(updatedReports);
        localStorage.setItem("reports", JSON.stringify(updatedReports));
        
        setMapCenter([newReport.location.lat, newReport.location.lng]);
        setViewMode("map");
        toast.success("Melding succesvol aangemaakt (offline modus)!");
      } else {
        toast.error("Er is een fout opgetreden bij het aanmaken van de melding.");
      }
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: BulkyWasteReport["status"]) => {
    try {
      if (!user) {
        toast.error("Niet ingelogd");
        return;
      }
      
      // Als lokale sessie, gebruik localStorage
      if (session?.access_token.startsWith("local-token-")) {
        const updatedReports = reports.map(report => {
          if (report.id === reportId) {
            return {
              ...report,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            };
          }
          return report;
        });
        
        setReports(updatedReports);
        localStorage.setItem("reports", JSON.stringify(updatedReports));
        toast.success("Status bijgewerkt!");
        return;
      }
      
      const requestBody = { 
        status: newStatus,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      };
      
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to update report status");
      }

      const data = await response.json();
      
      const updatedReport = {
        ...data.report,
        createdAt: new Date(data.report.createdAt),
      };

      setReports(reports.map(report => 
        report.id === reportId ? updatedReport : report
      ));
      toast.success("Status bijgewerkt!");
    } catch (error) {
      console.error("Error updating report status:", error);
      
      // Fallback naar lokale opslag bij server error
      if (error instanceof TypeError) {
        console.warn("Server niet bereikbaar, lokaal bijwerken");
        const updatedReports = reports.map(report => {
          if (report.id === reportId) {
            return {
              ...report,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name,
            };
          }
          return report;
        });
        
        setReports(updatedReports);
        localStorage.setItem("reports", JSON.stringify(updatedReports));
        toast.success("Status bijgewerkt (offline modus)!");
      } else {
        toast.error("Er is een fout opgetreden bij het bijwerken van de status.");
      }
    }
  };

  const handleViewOnMap = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setActiveTab("meldingen");
    setViewMode("map");
  };

  const handleUpdateProfile = async (data: { avatar?: string; neighborhood?: string; name?: string }) => {
    if (!user || !session) {
      toast.error("Niet ingelogd");
      throw new Error("Not authenticated");
    }

    const isLocalSession = session.access_token.startsWith("local-token-");

    // Als lokale sessie, gebruik localStorage
    if (isLocalSession) {
      const demoUsersRaw = localStorage.getItem("demo-users");
      let users = JSON.parse(demoUsersRaw || "[]");
      
      // If users array is empty or user doesn't exist, add current user
      if (users.length === 0 || !users.some((u: any) => u.id === user.id)) {
        users.push(user);
        localStorage.setItem("demo-users", JSON.stringify(users));
      }
      
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return { ...u, ...data };
        }
        return u;
      });
      
      localStorage.setItem("demo-users", JSON.stringify(updatedUsers));
      
      // Update the current session and user
      const currentUser = updatedUsers.find((u: any) => u.id === user.id);
      
      if (currentUser) {
        localStorage.setItem("user", JSON.stringify(currentUser));
        setUser(currentUser);
        toast.success("Profiel bijgewerkt!");
        return; // Success - exit without throwing
      }
      
      // Only throw if something really went wrong
      toast.error("Er is een fout opgetreden bij het bijwerken van je profiel");
      throw new Error("User not found in demo users");
    }

    // Server update
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
        "X-User-Token": session.access_token,
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();

    if (!response.ok) {
      toast.error(`Fout bij bijwerken profiel: ${responseData.error || 'Onbekende fout'}`);
      throw new Error(responseData.error || "Failed to update profile");
    }

    // Update local user state with server response
    const updatedUser = {
      ...user,
      ...responseData.user,
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("Profiel bijgewerkt!");
  };

  const getStatusColor = (status: BulkyWasteReport["status"]) => {
    switch (status) {
      case "gemeld":
        return "bg-yellow-500";
      case "in_behandeling":
        return "bg-blue-500";
      case "opgehaald":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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

  const activeReports = reports.filter((r) => r.status !== "opgehaald");

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Mobile Header - Only on mobile/tablet */}
      <div className="lg:hidden">
        <MobileHeader 
          userName={user?.name}
          userAvatar={user?.avatar}
          onLogout={logout}
          activeTab={activeTab}
        />
      </div>

      {/* Desktop Navigation - Only on desktop */}
      <div className="hidden lg:block">
        <DesktopNav 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={user?.role || "user"}
          userName={user?.name}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={logout}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden pb-20 lg:pb-0">
        {/* Map View */}
        {activeTab === "meldingen" && (
          <div className="h-full w-full">
            <BulkyWasteMap 
              reports={activeReports} 
              center={mapCenter}
            />
          </div>
        )}

        {/* List View */}
        {activeTab === "lijst" && (
          <div className="h-full overflow-auto p-4 pb-20 lg:pb-4">
            <div className="max-w-4xl mx-auto">
              <UserReportsView 
                reports={activeReports}
                onViewOnMap={(lat, lng) => {
                  setMapCenter([lat, lng]);
                  setActiveTab("meldingen");
                }}
              />

              {/* History - Last 10 Completed */}
              {reports.filter(r => r.status === "opgehaald").length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Historie - Opgehaald ({reports.filter(r => r.status === "opgehaald").length})
                  </h2>
                  
                  <div className="space-y-4">
                    {reports
                      .filter(r => r.status === "opgehaald")
                      .slice(0, 10)
                      .map((report) => (
                        <Card key={report.id} className="overflow-hidden opacity-75">
                          <CardContent className="p-5">
                            <div className="flex gap-4">
                              {report.photo && (
                                <img
                                  src={report.photo}
                                  alt={report.type}
                                  className="w-28 h-28 object-cover rounded-xl flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-lg font-semibold">{report.type}</h3>
                                  <Badge
                                    className="bg-green-500 text-white px-3 py-1"
                                    variant="default"
                                  >
                                    Opgehaald
                                  </Badge>
                                </div>

                                {report.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {report.description}
                                  </p>
                                )}

                                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                  <p>
                                    <strong>Adres:</strong> {report.address}
                                  </p>
                                  <p>
                                    <strong>Gemeld op:</strong>{" "}
                                    {format(report.createdAt, "d MMMM yyyy", {
                                      locale: nl,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Worker Dashboard */}
        {activeTab === "beheer" && (user?.role === "werknemer" || user?.role === "admin") && (
          <div className="h-full overflow-auto p-4 pb-20 lg:pb-4">
            <div className="max-w-6xl mx-auto">
              <WorkerDashboard 
                reports={reports}
                onStatusChange={handleStatusChange}
                onViewOnMap={handleViewOnMap}
                userLocation={userLocation}
              />
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {activeTab === "admin" && user?.role === "admin" && (
          <div className="h-full overflow-auto p-4 pb-20 lg:pb-4">
            <div className="max-w-6xl mx-auto">
              <AdminDashboard 
                reports={reports} 
                onRefresh={fetchReports} 
                accessToken={session?.access_token}
              />
            </div>
          </div>
        )}

        {/* User Profile */}
        {activeTab === "profiel" && (
          <div className="h-full overflow-auto p-4 pb-20 lg:pb-4">
            <div className="max-w-3xl mx-auto">
              <UserProfile user={user} onUpdateProfile={handleUpdateProfile} />
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "instellingen" && (
          <div className="h-full overflow-auto p-4 pb-20 lg:pb-4">
            <div className="max-w-3xl mx-auto">
              <SettingsView 
                user={user} 
                onUpdateProfile={handleUpdateProfile}
                onLogout={logout}
                isDarkMode={theme === 'dark'}
                onToggleDarkMode={toggleTheme}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={user?.role || "user"}
      />

      {/* Floating Action Button - For all roles */}
      <FloatingActionButton 
        onClick={() => setIsFormOpen(true)}
        label="Grofvuil Melden"
      />

      {/* Report form sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Nieuwe melding</SheetTitle>
            <SheetDescription>
              Vul het formulier in om grofvuil te melden in uw buurt
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ReportForm
              onSubmit={handleSubmitReport}
              onClose={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Toaster />
      {showTour && <AppTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}