import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Long-term-cacheable vendor chunks: React and the Appwrite SDK change
    // far less often than app code, so keeping them separate means a content
    // edit doesn't invalidate ~200 kB of framework for returning visitors.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          appwrite: ['appwrite'],
        },
      },
    },
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
});
