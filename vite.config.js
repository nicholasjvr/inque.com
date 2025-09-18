import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".", // serve from project root
  publicDir: "assets", // static assets folder
  // Use relative paths so assets work on Firebase and GitHub Pages
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Build all html entry points so Firebase can serve them directly
      input: {
        main: resolve(__dirname, "index.html"),
        explore: resolve(__dirname, "pages/explore.html"),
        users: resolve(__dirname, "pages/users.html"),
        myProjects: resolve(
          __dirname,
          "pages/profile_dashboard/my-projects.html"
        ),
        inventory: resolve(__dirname, "pages/profile_dashboard/inventory.html"),
        widgetStudio: resolve(
          __dirname,
          "pages/profile_dashboard/widget_studio.html"
        ),
        profileEdit: resolve(
          __dirname,
          "pages/profile_dashboard/profile-edit.html"
        ),
        knowledgeBase: resolve(__dirname, "pages/knowledge-base.html"),
      },
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
