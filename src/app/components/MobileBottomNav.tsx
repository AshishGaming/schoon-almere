import { MapIcon, List, Briefcase, Shield, UserCircle, Settings } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: "user" | "werknemer" | "admin";
}

export function MobileBottomNav({ activeTab, onTabChange, userRole }: MobileBottomNavProps) {
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

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 safe-area-inset-bottom z-50 shadow-2xl">
      <div className="flex items-center justify-around h-20 px-2 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 min-w-[68px] flex-1 transition-all rounded-xl ${
                isActive
                  ? "text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className={`h-6 w-6 transition-all ${isActive ? "scale-110" : ""}`} />
              <span className={`text-xs font-medium transition-all ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}