// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
var __electron_vite_injected_dirname = "C:\\Ivania\\Projetos igrp\\igrp-studio-horizon";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/main/index.ts")
        }
      }
    },
    envPrefix: "VITE_"
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload"
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        path: "path-browserify"
      }
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
    },
    plugins: [react()],
    optimizeDeps: {
      exclude: ["monaco-editor"]
    },
    css: {
      postcss: "./postcss.config.mjs"
    },
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        output: {
          manualChunks: {
            "monaco-editor": ["monaco-editor"]
          }
        }
      }
    },
    server: {
      fs: {
        strict: false
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
