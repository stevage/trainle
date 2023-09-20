import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuePugPlugin from 'vue-pug-plugin'
import { fileURLToPath, URL } from "node:url";
// https://vitejs.dev/config/
export default defineConfig({
  base:'',
  plugins: [vue({
    template: {
      preprocessOptions: { // 'preprocessOptions' is passed through to the pug compiler
        plugins: [
          vuePugPlugin
        ]
      }
    }
  },)],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
