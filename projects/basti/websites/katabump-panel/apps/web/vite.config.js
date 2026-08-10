import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@katabump/common": fileURLToPath(new URL("../../packages/common/src/index.mjs", import.meta.url)),
      "@katabump/runtime": fileURLToPath(new URL("../../packages/runtime/src/index.mjs", import.meta.url))
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/runtime": { target: "http://localhost:4100", changeOrigin: true, ws: true },
      "/healthz": { target: "http://localhost:4000", changeOrigin: true }
    }
  }
});