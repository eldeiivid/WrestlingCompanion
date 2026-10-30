import { supabase } from "../../../lib/supabase";

import type { LoginInput, RegisterInput } from "../types/auth.types";

export const authService = {
  async signIn({ email, password }: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    return data;
  },

  async signUp({ email, password, username }: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  },
};
