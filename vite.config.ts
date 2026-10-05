import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served by CloudFront from the domain root, so base is '/'. Set for dev
  // as well as build so a path that ignores the base fails locally too.
  base: '/',
  plugins: [react()],
  server: { port: 5173 },
});
