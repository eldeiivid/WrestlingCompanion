import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";
import { AuthContext } from "./AuthContext";
import { authService } from "./services/authService";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      receivedAuthEvent = true;

      setSession(nextSession);
      setInitializationError(null);
      setIsLoading(false);
    });

    async function initializeSession() {
      try {
        const initialSession = await authService.getSession();

        // Evita reemplazar una sesión más reciente recibida por el listener.
        if (!active || receivedAuthEvent) return;

        setSession(initialSession);
        setIsLoading(false);
      } catch {
        if (!active || receivedAuthEvent) return;

        setInitializationError(
          "No se pudo recuperar la sesión. Recarga la página para intentarlo nuevamente.",
        );
        setIsLoading(false);
      }
    }

    void initializeSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        initializationError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
