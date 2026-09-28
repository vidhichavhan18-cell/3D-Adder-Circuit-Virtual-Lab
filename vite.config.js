import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        circuit: resolve(__dirname, 'circuit.html'),
        practice: resolve(__dirname, 'practice.html')
      }
    }
  }
});
