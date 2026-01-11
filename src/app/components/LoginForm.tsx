import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Trash2, Moon, Sun } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { toast } from "sonner";

export function LoginForm() {
  const { login, signup, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      toast.success("Succesvol ingelogd!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signup(signupEmail, signupPassword, signupName);
      toast.success("Account aangemaakt!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registratie mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      {/* Theme toggle button - absolute positioned */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleTheme}
        className="absolute top-4 right-4 gap-2"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trash2 className="h-8 w-8 text-green-600" />
            <CardTitle className="text-2xl">Grofvuil Melden</CardTitle>
          </div>
          <CardDescription>
            Log in of registreer een nieuw account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Inloggen</TabsTrigger>
              <TabsTrigger value="signup">Registreren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="voorbeeld@email.nl"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Wachtwoord</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inloggen...
                    </>
                  ) : (
                    "Inloggen"
                  )}
                </Button>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Demo Accounts:
                  </p>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p>👤 Gebruiker: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">user@example.nl</code> / <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">user123</code></p>
                    <p>👷 Werknemer: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">werknemer@grofvuil.nl</code> / <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">werk123</code></p>
                    <p>🛡️ Admin: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">admin@grofvuil.nl</code> / <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">admin123</code></p>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Naam</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jan Jansen"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="voorbeeld@email.nl"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Wachtwoord</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registreren...
                    </>
                  ) : (
                    "Account aanmaken"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}