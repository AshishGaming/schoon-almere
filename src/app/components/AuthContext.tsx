import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export type UserRole = "user" | "werknemer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  neighborhood?: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2f5e78e8`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check voor opgeslagen sessie
    const checkSession = async () => {
      const savedSession = localStorage.getItem("session");
      const savedUser = localStorage.getItem("user");
      
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          setSession(sessionData);
          
          // Als het een lokale sessie is, gebruik de opgeslagen user data
          if (sessionData.access_token.startsWith("local-token-") && savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            
            // Ensure demo-users array is initialized
            const existingDemoUsers = JSON.parse(localStorage.getItem("demo-users") || "[]");
            const userExists = existingDemoUsers.some((u: any) => u.id === userData.id);
            if (!userExists) {
              existingDemoUsers.push(userData);
              localStorage.setItem("demo-users", JSON.stringify(existingDemoUsers));
            }
            
            setIsLoading(false);
            return;
          }
          
          // Verify session with server
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${sessionData.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Session is invalid, clear it
            localStorage.removeItem("session");
            localStorage.removeItem("user");
            setSession(null);
          }
        } catch (error) {
          console.error("Error checking session:", error);
          localStorage.removeItem("session");
          localStorage.removeItem("user");
          setSession(null);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Login error response:", error);
        throw new Error(error.error || "Inloggen mislukt");
      }

      const data = await response.json();
      
      setUser(data.user);
      setSession(data.session);
      localStorage.setItem("session", JSON.stringify(data.session));
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      console.error("Login error:", error);
      
      // Fallback voor demo: lokale authenticatie als server niet beschikbaar is
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("⚠️  Server niet bereikbaar, gebruik lokale demo authenticatie");
        
        // Demo gebruikers voor lokale auth
        const demoUsers = [
          { email: "admin@grofvuil.nl", password: "admin123", name: "Admin Gebruiker", role: "admin" as UserRole },
          { email: "werknemer@grofvuil.nl", password: "werk123", name: "Werknemer Jan", role: "werknemer" as UserRole },
          { email: "user@example.nl", password: "user123", name: "Normale Gebruiker", role: "user" as UserRole },
        ];
        
        const demoUser = demoUsers.find(u => u.email === email && u.password === password);
        
        if (demoUser) {
          const localUser = {
            id: `local-${Date.now()}`,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
          };
          
          const localSession = {
            access_token: `local-token-${Date.now()}`,
            refresh_token: `local-refresh-${Date.now()}`,
          };
          
          setUser(localUser);
          setSession(localSession);
          localStorage.setItem("session", JSON.stringify(localSession));
          localStorage.setItem("user", JSON.stringify(localUser));
          
          // Initialize demo-users array for profile updates
          const existingDemoUsers = JSON.parse(localStorage.getItem("demo-users") || "[]");
          const userExists = existingDemoUsers.some((u: any) => u.id === localUser.id);
          if (!userExists) {
            existingDemoUsers.push(localUser);
            localStorage.setItem("demo-users", JSON.stringify(existingDemoUsers));
          }
          
          return;
        } else {
          throw new Error("Ongeldige inloggegevens");
        }
      }
      
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, role: "user" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registratie mislukt");
      }

      const data = await response.json();
      
      // After signup, automatically log in
      await login(email, password);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("session");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        session,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}