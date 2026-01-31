import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: './src/main.js', // Onde o build começa
      name: 'MultiversusRPG',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.css', // Garante que o CSS vá para style.css
        dir: './' // Joga o index.js e style.css na raiz do módulo
      }
    }
  }
}); 