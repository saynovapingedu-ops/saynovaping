import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base path ต้องตรงกับชื่อ GitHub repo
// URL จะเป็น https://saynovapingedu-ops.github.io/saynovaping/
export default defineConfig({
  plugins: [react()],
  base: '/saynovaping/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
