import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    watch: { usePolling: true }
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-toast',
            'framer-motion',
            'lucide-react',
          ],
          privy: ['@privy-io/react-auth'],
          solana: ['@solana/web3.js', '@solana/spl-token', '@coral-xyz/anchor'],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      {
        find: /^@phosphor-icons\/webcomponents\/.*$/,
        replacement: path.resolve(__dirname, 'src/shims/empty-module.ts'),
      },
      {
        find: /^@farcaster\/mini-app-solana$/,
        replacement: path.resolve(__dirname, 'src/shims/empty-module.ts'),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      'lucide-react',
      '@privy-io/react-auth',
      '@privy-io/react-auth/solana',
      '@radix-ui/react-toast',
      'class-variance-authority',
      'react-router-dom',
      'react-dom/client',
    ],
  },
}) 
