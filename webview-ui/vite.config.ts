import { fileURLToPath, URL } from 'url'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    copy({
      targets: [
        { src: 'node_modules/@vscode/codicons/dist/*', dest: 'public/codicons'}
      ],
      hook: 'writeBundle'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        deployment: resolve(__dirname, 'entry', 'deployment.html'),
        network: resolve(__dirname, 'entry', 'network.html'),
        wallet: resolve(__dirname, 'entry', 'wallet.html'),
        console: resolve(__dirname, 'entry', 'console.html'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
    },
  },
})
