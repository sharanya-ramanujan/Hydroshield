import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Hydroshield/', // replace with '/<your-repo-name>/' if different
})
