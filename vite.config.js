import { defineConfig } from 'vite'
import fs from 'fs'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [svgLoader()],
  root: './client',
  server: {
    https: {
      key: fs.readFileSync(process.env.CERT_KEY),
      cert: fs.readFileSync(process.env.CERT_PEM),
    }
  }
})
