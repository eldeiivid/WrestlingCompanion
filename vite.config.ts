import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",

      includeAssets: [
        "icons/app-icon.svg",
        "icons/icon-16.png",
        "icons/icon-32.png",
        "icons/icon-180.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
      ],

      manifest: {
        id: "/",
        name: "WrestlingBook",
        short_name: "WrestlingBook",

        description:
          "Manage your wrestling careers, shows, roster, rivalries, and championships.",

        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",

        background_color: "#101316",
        theme_color: "#101316",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],

        navigateFallback: "index.html",

        // Authenticated Supabase responses are not cached.
        runtimeCaching: [],
      },
    }),
  ],
});
