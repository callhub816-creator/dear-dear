import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ Important settings for GitHub Pages
  base: "./", // relative paths for static hosting (fixes MIME error)
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },

  // ✅ Optional (for smoother local previews)
  preview: {
    port: 4173,
    strictPort: true,
  },
}));
