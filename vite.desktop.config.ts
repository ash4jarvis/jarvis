import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "desktop-ui"),
  base: "./",
  server: { host: "127.0.0.1", port: 1421, strictPort: true },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: path.resolve(__dirname, "dist-desktop"), emptyOutDir: true },
});
