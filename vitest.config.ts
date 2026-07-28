import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // `npm run build` recopie `src/` (donc les `*.test.ts`) dans la sortie
    // standalone : sans cette exclusion, lancer les tests APRÈS un build fait
    // échouer des doublons qui s'exécutent hors de leur arborescence.
    exclude: ["node_modules/**", "dist/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
