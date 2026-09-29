import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build can be served from any path (artifact, static host, file preview).
export default defineConfig({
  base: './',
  plugins: [react()],
});
