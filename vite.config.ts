import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "./index.html",
      output: {
        manualChunks: undefined,
      },
    },
  },
});
