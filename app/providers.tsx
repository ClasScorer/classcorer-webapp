"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";

// Create a custom session context
const SessionContext = createContext({
  session: null,
  update: (data: any) => {},
  logout: () => {},
});

// Custom hook to use the session
export const useSession = () => useContext(SessionContext);

// Custom session provider
function CustomSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        setSession({
          user: JSON.parse(userData),
          token
        });
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }, []);

  // Function to update the session
  const update = (data: any) => {
    setSession({ user: data });
    localStorage.setItem('userData', JSON.stringify(data));
  };

  // Function to logout
  const logout = () => {
    setSession(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    document.cookie = 'authToken=; path=/; max-age=0';
  };

  return (
    <SessionContext.Provider value={{ session, update, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CustomSessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </CustomSessionProvider>
  );
} 