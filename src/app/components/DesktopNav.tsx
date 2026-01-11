import { MapIcon, List, Briefcase, Shield, Settings, Trash2, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "./ui/button";

interface DesktopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: "user" | "werknemer" | "admin";
  userName: string;
  userAvatar?: string;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function DesktopNav({ activeTab, onTabChange, userRole, userName, userAvatar, onLogout, theme, onToggleTheme }: DesktopNavProps) {
  // Different nav items based on role
  const getNavItems = () => {
    if (userRole === "admin") {
      return [
        { id: "meldingen", icon: MapIcon, label: "Kaart" },
        { id: "lijst", icon: List, label: "Lijst" },
        { id: "instellingen", icon: Settings, label: "Instellingen" },
        { id: "admin", icon: Shield, label: "Admin" },
      ];
    } else if (userRole === "werknemer") {
      return [
        { id: "meldingen", icon: MapIcon, label: "Kaart" },
        { id: "beheer", icon: Briefcase, label: "Beheer" },
        { id: "instellingen", icon: Settings, label: "Instellingen" },
      ];
    } else {
      return [
        { id: "meldingen", icon: MapIcon, label: "Kaart" },
        { id: "lijst", icon: List, label: "Lijst" },
        { id: "instellingen", icon: Settings, label: "Instellingen" },
      ];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (userRole) {
      case "admin": return "Administrator";
      case "werknemer": return "Werknemer";
      default: return "Gebruiker";
    }
  };

  return (
    <nav className="hidden lg:flex sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
            <Trash2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SCHOON</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Grofvuil Almere</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-3xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${
                  isActive
                    ? "text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-slate-400 font-medium px-3">
            {userName}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleTheme}
            className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout} 
            className="gap-2 rounded-xl border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Uitloggen</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}