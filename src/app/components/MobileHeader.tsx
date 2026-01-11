import { Trash2 } from "lucide-react";

interface MobileHeaderProps {
  activeTab: string;
  userName: string;
  userAvatar?: string;
  onLogout: () => void;
}

export function MobileHeader({ activeTab, userName, userAvatar, onLogout }: MobileHeaderProps) {
  const getTitle = () => {
    switch (activeTab) {
      case "meldingen": return "Kaart";
      case "lijst": return "Mijn Meldingen";
      case "beheer": return "Beheer";
      case "admin": return "Admin Dashboard";
      case "instellingen": return "Instellingen";
      default: return "Grofvuil Melden";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm lg:hidden">
      {/* Main header */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex-shrink-0 shadow-md">
            <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              SCHOON
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 truncate mt-0.5">
              {getTitle()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}