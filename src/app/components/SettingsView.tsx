import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { User, Check, Moon, Sun, LogOut, Settings as SettingsIcon, Info, HelpCircle, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    neighborhood?: string;
  };
  onUpdateProfile: (data: { avatar?: string; neighborhood?: string; name?: string }) => Promise<void>;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const AVATARS = [
  '👤', '👨', '👩', '🧑', '👴', '👵',
  '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🌾', '👩‍🌾',
  '😀', '😊', '🙂', '😎', '🤓', '🧐',
  '🐶', '🐱', '🐻', '🦊', '🐼', '🐨',
];

const ALMERE_NEIGHBORHOODS = [
  'Almere Stad',
  'Almere Haven',
  'Almere Buiten',
  'Almere Hout',
  'Almere Poort',
  'Almere Pampus',
  'Almere Centrum',
];

type ViewType = 'menu' | 'profiel' | 'app' | 'info';

export function SettingsView({ user, onUpdateProfile, onLogout, isDarkMode, onToggleDarkMode }: SettingsViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '👤');
  const [name, setName] = useState(user.name);
  const [neighborhood, setNeighborhood] = useState(user.neighborhood || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        avatar: selectedAvatar,
        neighborhood,
        name,
      });
      toast.success("Profiel bijgewerkt!");
    } catch (error) {
      console.error("SettingsView: Failed to update profile:", error);
      // Error already displayed by onUpdateProfile
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    {
      id: 'profiel',
      icon: User,
      title: 'Profiel',
      description: 'Bewerk je persoonlijke informatie',
      color: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      id: 'app',
      icon: SettingsIcon,
      title: 'App-instellingen',
      description: 'Weergave en notificaties',
      color: 'text-blue-600 dark:text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 'info',
      icon: Info,
      title: 'Info & Credits',
      description: 'Over SCHOON en support',
      color: 'text-purple-600 dark:text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  // Main Menu View
  if (currentView === 'menu') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="px-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Instellingen</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Beheer je profiel en voorkeuren
          </p>
        </div>

        {/* User Info Card */}
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-800">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-3xl sm:text-4xl ring-4 ring-green-200 dark:ring-green-800">
                {selectedAvatar}
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                  <span className="font-medium">Ingelogd bij:</span> <span className="font-bold text-green-600 dark:text-green-500">SCHOON</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className="w-full p-4 sm:p-5 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-green-500 dark:hover:border-green-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 ${item.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Button
            onClick={onLogout}
            variant="outline"
            size="lg"
            className="w-full gap-2 h-12 sm:h-14 text-base font-semibold border-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-500 dark:hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
            Uitloggen
          </Button>
        </div>
      </div>
    );
  }

  // Profile View
  if (currentView === 'profiel') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView('menu')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Terug naar instellingen</span>
        </button>

        {/* Header */}
        <div className="px-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Profiel</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Bewerk je persoonlijke informatie
          </p>
        </div>

        {/* Avatar Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Kies je profielfoto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 sm:gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`
                    relative w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl rounded-lg border-2 transition-all
                    hover:scale-110 hover:shadow-md
                    ${
                      selectedAvatar === avatar
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/30 shadow-lg scale-110'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-400'
                    }
                  `}
                >
                  {avatar}
                  {selectedAvatar === avatar && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Persoonlijke informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base">Naam</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base h-12"
                placeholder="Je naam"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="text-base h-12 bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                E-mailadres kan niet worden gewijzigd
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-sm sm:text-base">Wijk in Almere</Label>
              <select
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-4 h-12 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">Selecteer een wijk</option>
                {ALMERE_NEIGHBORHOODS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Deze informatie helpt ons om je beter van dienst te zijn
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            size="lg"
            className="bg-green-600 hover:bg-green-700 gap-2 h-12 sm:h-14 text-base font-semibold px-8"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Opslaan...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Wijzigingen opslaan
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // App Settings View
  if (currentView === 'app') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView('menu')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Terug naar instellingen</span>
        </button>

        {/* Header */}
        <div className="px-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">App-instellingen</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Pas de weergave en voorkeuren aan
          </p>
        </div>

        {/* Dark Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Weergave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                ) : (
                  <Sun className="h-6 w-6 text-yellow-600" />
                )}
                <div>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">
                    {isDarkMode ? 'Donkere modus' : 'Lichte modus'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Schakel tussen licht en donker thema
                  </p>
                </div>
              </div>
              <Button
                onClick={onToggleDarkMode}
                size="lg"
                className={`gap-2 h-12 min-w-[120px] ${
                  isDarkMode 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-5 w-5" />
                    Licht
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    Donker
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Notificaties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notificatie-instellingen zijn momenteel niet beschikbaar. Deze functie wordt binnenkort toegevoegd.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info View
  if (currentView === 'info') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView('menu')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Terug naar instellingen</span>
        </button>

        {/* Header */}
        <div className="px-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Info & Credits</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Over SCHOON en ondersteuning
          </p>
        </div>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
              Over SCHOON
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                SCHOON is een gebruiksvriendelijke applicatie voor het melden van grofvuil in Almere. 
                Samen houden we onze stad schoon!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Versie</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Build</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">2025.01</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Ontwikkeling</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gebouwd met React, TypeScript en Tailwind CSS</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Kaarten</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">OpenStreetMap & Leaflet</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Gemeente Almere</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voor een schone en leefbare stad</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Contact & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Heb je vragen of feedback? Neem contact met ons op via:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> info@schoon-almere.nl
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Telefoon:</strong> 036 - 123 4567
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}