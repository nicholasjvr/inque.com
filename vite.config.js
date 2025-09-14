import { defineConfig } from "vite";

export default defineConfig({
  root: ".", // serve from project root
  publicDir: "assets", // static assets folder
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html",
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  // Keep your debug logs in development
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
});
