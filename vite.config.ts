import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react")) {
              return "react";
            }
            if (id.includes("react-dom")) {
              return "react-dom";
            }
            if (id.includes("react-router")) {
              return "router";
            }
            if (id.includes("@mui/material")) {
              return "mui-material";
            }
            if (id.includes("@mui/icons")) {
              return "mui-icons";
            }
            if (id.includes("@emotion")) {
              return "emotion";
            }
            if (id.includes("dagre")) {
              return "dagre";
            }
            if (id.includes("lodash")) {
              return "lodash";
            }
            if (id.includes("fast-xml-parser")) {
              return "xml-parser";
            }
            return "vendor";
          }
        },
      },
      external: ["express"],
    },
    target: "es2015",
    cssCodeSplit: false,
    assetsInlineLimit: 1024,
    reportCompressedSize: false,
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["express"],
  },
  esbuild: {
    target: "es2015",
    keepNames: false,
  },
});
