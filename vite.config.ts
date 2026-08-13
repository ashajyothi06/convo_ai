import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: "https://gyaini.com:6880",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});