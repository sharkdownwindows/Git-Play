import { randomUUID } from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __DEV_SESSION_ID__: JSON.stringify(randomUUID()) },
  build: { outDir: "dist" },
});
