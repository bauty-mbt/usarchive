import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: GitHub Pages sirve el sitio en /usarchive/, no en la raíz del dominio.
export default defineConfig({
  base: "/usarchive/",
  plugins: [react()],
  server: { port: 5173 },
});
