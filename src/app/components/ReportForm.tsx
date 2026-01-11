import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MapPin, Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface BulkyWasteReport {
  id: string;
  type: string;
  description: string;
  photo?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  userId: string;
  userName: string;
  createdAt: Date | string;
  updatedAt?: string;
  updatedBy?: string;
  status: "gemeld" | "in_behandeling" | "opgehaald";
}

interface ReportFormProps {
  onSubmit: (report: Omit<BulkyWasteReport, "id" | "createdAt" | "status">) => void;
  onClose: () => void;
}

export function ReportForm({ onSubmit, onClose }: ReportFormProps) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setShowManualInput(false);
    
    if (!navigator.geolocation) {
      toast.error("Geolocatie wordt niet ondersteund door uw browser");
      setIsLoadingLocation(false);
      setShowManualInput(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocation({ lat, lng });
        
        // Reverse geocoding om adres te krijgen (mock versie)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setSearchQuery(data.display_name || "");
        } catch (error) {
          console.error("Error fetching address:", error);
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setSearchQuery(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        
        setIsLoadingLocation(false);
        toast.success("Locatie succesvol vastgelegd");
      },
      (error) => {
        console.error("Error getting location:", {
          code: error.code,
          message: error.message,
          error: error
        });
        let errorMessage = "Kon locatie niet bepalen.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Locatietoegang geweigerd. Voer uw locatie handmatig in.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Locatie-informatie is niet beschikbaar. Voer uw locatie handmatig in.";
            break;
          case error.TIMEOUT:
            errorMessage = "Locatieverzoek is verlopen. Voer uw locatie handmatig in.";
            break;
        }
        
        toast.error(errorMessage);
        setIsLoadingLocation(false);
        setShowManualInput(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Foto is te groot. Maximaal 5MB toegestaan.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!type.trim()) {
      toast.error("Voer een type grofvuil in");
      return;
    }

    if (!location) {
      toast.error("Bepaal eerst uw locatie");
      return;
    }

    onSubmit({
      type,
      description,
      photo,
      location,
      address,
    });

    toast.success("Melding succesvol aangemaakt!");
    onClose();
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Fout bij zoeken naar locatie");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: typeof suggestions[0]) => {
    setLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setAddress(suggestion.display_name);
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    toast.success("Locatie geselecteerd");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Grofvuil melden</CardTitle>
        <CardDescription>
          Vul onderstaande gegevens in om grofvuil te melden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Type grofvuil *</Label>
            <Input
              id="type"
              placeholder="Bijv. bank, koelkast, matras..."
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving (optioneel)</Label>
            <Textarea
              id="description"
              placeholder="Extra informatie over het grofvuil..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (optioneel)</Label>
            <div className="flex gap-2 items-start">
              {!photo ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Foto toevoegen
                </Button>
              ) : (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Grofvuil foto"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setPhoto(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Locatie *</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="flex-1 gap-2"
                >
                  {isLoadingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Locatie bepalen...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      GPS gebruiken
                    </>
                  )}
                </Button>
                {!showManualInput && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualInput(true)}
                  >
                    Handmatig
                  </Button>
                )}
              </div>

              {showManualInput && (
                <div className="space-y-2 relative">
                  <div className="relative">
                    <Input
                      placeholder="Voer uw adres in..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pr-10"
                    />
                    {isSearching && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>
                  
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <p className="text-sm">{suggestion.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {location && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
                  <p className="text-green-800 dark:text-green-200">
                    <strong>Locatie vastgelegd:</strong>
                  </p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    {address}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Melding indienen
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}