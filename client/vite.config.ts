import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
        }
      },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo && assetInfo.name) {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|webm|mp3)$/.test(assetInfo.name)) {
              return `media/[name]-[hash].${extType}`;
            }
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${extType}`;
            }
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${extType}`;
            }
            return `assets/[name]-[hash].${extType}`;
          }
          return `assets/${assetInfo.name}`;
        },
      }
    }
  },
  plugins: [react()],
})
