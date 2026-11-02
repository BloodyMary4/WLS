import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages отдаёт сайт из корня /WLS/, поэтому абсолютный base "/" ломал
  // загрузку JS/CSS на https://bloodymary4.github.io/WLS/ — экран оставался
  // чёрным (было видно только favicon-Аквилу). Относительный base работает и на
  // Pages, и при прямом открытии dist/index.html (file://), и в Electron.
  base: process.env.VITE_BASE || "./",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});
