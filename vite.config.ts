import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],

  // 部署到子目录时修改此处，如 '/games/'
  // 或者通过 CLI 传入: vite build --base=/my-app/
  base: '/',

  build: {
    // 生成 sourcemap 便于调试生产问题（生产环境可设为 false）
    sourcemap: false,
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})