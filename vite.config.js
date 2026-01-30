import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '.', // Joga na raiz do módulo
    emptyOutDir: false, // Não deleta seus outros arquivos
    lib: {
      entry: './src/main.js', // <--- AQUI: Pega do seu SRC
      name: 'MultiversusRPG',
      fileName: () => 'index.js', // <--- AQUI: Salva como index.js na raiz
      formats: ['es']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.css', // Salva o CSS na raiz também
      }
    }
  }
});