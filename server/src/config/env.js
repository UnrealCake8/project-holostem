import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadDotenv } from 'dotenv'

const envFiles = ['.env.local', '.env']

if (process.env.NODE_ENV !== 'production') {
  for (const envFile of envFiles) {
    const envPath = resolve(process.cwd(), envFile)
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath, override: false })
    }
  }
}
