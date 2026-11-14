import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const instance = JSON.parse(readFileSync(new URL("../instance.config.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
export default defineConfig({
  esbuild: { keepNames: true },
  plugins: [react(), tailwindcss()],
  preview: { port: instance.webPort, headers: { "Cache-Control": "no-store" } },
  server: {
    port: instance.webPort,
    headers: { "Cache-Control": "no-store" },
    proxy: { "/api": process.env.VITE_API_TARGET ?? `http://127.0.0.1:${instance.apiPort}` },
  },
});
