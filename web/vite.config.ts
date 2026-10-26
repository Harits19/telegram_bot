import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Backend admin API diasumsikan di :3000. Dengan proxy ini frontend tidak
    // butuh CORS selama dev.
    proxy: {
      "/api": {
        target: process.env.API_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
