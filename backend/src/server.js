import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initStore } from './store/index.js'
import createUsersRouter from './routes/users.js'
import createTripsRouter from './routes/trips.js'
import createWalletRouter from './routes/wallet.js'
import createMessagesRouter from './routes/messages.js'
import createAuthRouter from './routes/auth.js'
import { seedDemo } from './seed.js'

dotenv.config()

async function start() {
  const app = express()
  const PORT = process.env.PORT || 4000

  const store = await initStore()
  console.log(`Store driver: ${store.driver}`)
  if (process.env.SEED_DEMO === 'true') {
    await seedDemo(store)
  }

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '5mb' }))

  app.get('/api/health', (_req, res) => res.json({ ok: true, driver: store.driver }))
  app.use('/api/users', createUsersRouter(store))
  app.use('/api/trips', createTripsRouter(store))
  app.use('/api/wallet', createWalletRouter())
  app.use('/api/auth', createAuthRouter(store))
  app.use('/api/messages', createMessagesRouter(store))

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  })

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
  })
}

start().catch((e) => {
  console.error('Failed to start server', e)
  process.exit(1)
})
