import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Hydroshield/', // CHANGE to your GitHub repo name, e.g. '/Hydroshield/'
})
