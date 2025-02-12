import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".", // Optional: Ensure root is set correctly
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
