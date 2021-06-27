import { defineConfig } from 'vite'
import fs from 'fs'

export default defineConfig({
  root: './client',
  server: {
    https: {
      key: fs.readFileSync(process.env.CERT_KEY),
      cert: fs.readFileSync(process.env.CERT_PEM),
    }
  }
})
