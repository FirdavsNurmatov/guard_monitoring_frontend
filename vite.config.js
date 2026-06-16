import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // antd va ikonkalarni BIRGA
          if (
            id.includes("antd") ||
            id.includes("rc-") ||
            id.includes("@ant-design")
          )
            return "antd";

          if (id.includes("@tanstack")) return "query";
          if (id.includes("zustand")) return "store";
          if (id.includes("react-router")) return "router";
          if (id.includes("leaflet")) return "map";
          if (id.includes("xlsx")) return "excel";
          if (id.includes("socket.io")) return "socket";
          if (id.includes("i18next") || id.includes("react-i18next"))
            return "i18n";
        },
      },
    },
  },
});
