import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@mui/icons-material'], // MUI icons oldindan optimallashtirilsin
  },
  server: {
    hmr: {
      overlay: false, // Xatoliklar oynasini o‘chiradi
    },
  },
})
