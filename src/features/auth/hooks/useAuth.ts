import { useContext } from "react";

import { AuthContext } from "../AuthContext";
import { authService } from "../services/authService";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return {
    ...context,
    user: context.session?.user ?? null,
    isAuthenticated: context.session !== null,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signInWithGoogle: authService.signInWithGoogle,
    signOut: authService.signOut,
  };
}
