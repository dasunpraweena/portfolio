import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ }] } } } },
  server: { host: 'localhost', port: 5174, strictPort: true },
  preview: { host: 'localhost', port: 5174, strictPort: true },
});
