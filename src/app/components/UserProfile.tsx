import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { User, Check } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    neighborhood?: string;
  };
  onUpdateProfile: (data: { avatar?: string; neighborhood?: string; name?: string }) => Promise<void>;
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

export function UserProfile({ user, onUpdateProfile }: UserProfileProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '👤');
  const [name, setName] = useState(user.name);
  const [neighborhood, setNeighborhood] = useState(user.neighborhood || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      await onUpdateProfile({
        avatar: selectedAvatar,
        neighborhood,
        name,
      });
      // Success! No error to handle
    } catch (error) {
      console.error("UserProfile: Failed to update profile:", error);
      // Error already displayed by onUpdateProfile
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl">
          {selectedAvatar}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Avatar Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kies je profielfoto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`
                  relative w-12 h-12 text-2xl rounded-lg border-2 transition-all
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
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
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
          <CardTitle className="text-xl">Persoonlijke informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">Naam</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base py-6"
              placeholder="Je naam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="text-base py-6 bg-gray-100 dark:bg-gray-800"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              E-mailadres kan niet worden gewijzigd
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood" className="text-base">Wijk in Almere</Label>
            <select
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Selecteer een wijk</option>
              {ALMERE_NEIGHBORHOODS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deze informatie helpt ons om je beter van dienst te zijn
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Account type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <User className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.role === 'admin' && 'Administrator'}
                {user.role === 'werknemer' && 'Werknemer'}
                {user.role === 'user' && 'Gebruiker'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.role === 'admin' && 'Volledige toegang tot alle functies en statistieken'}
                {user.role === 'werknemer' && 'Kan meldingen beheren en statusupdates uitvoeren'}
                {user.role === 'user' && 'Kan meldingen maken en bekijken'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="bg-green-600 hover:bg-green-700 gap-2 px-8 text-base"
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