import express from 'express'

export default function createMessagesRouter(store) {
  const router = express.Router()

  // Send a message (bug report or organizer/system message)
  router.post('/', async (req, res, next) => {
    try {
      const { from, to, type, subject, body } = req.body || {}
      if (!from || !body) return res.status(400).json({ error: 'from and body are required' })
      const target = to || 'admin'
      if (!store.messages || !store.messages.send) return res.status(500).json({ error: 'Messages not supported' })
      const out = await store.messages.send({ from, to: target, type: type || 'bug', subject, body })
      res.status(201).json({ id: out.id })
    } catch (e) {
      next(e)
    }
  })

  // Fetch inbox for a wallet (or 'admin')
  router.get('/inbox/:walletAddress', async (req, res, next) => {
    try {
      const { walletAddress } = req.params
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })
      if (!store.messages || !store.messages.inboxFor) return res.status(500).json({ error: 'Messages not supported' })
      const rows = await store.messages.inboxFor(walletAddress)
      res.json(rows)
    } catch (e) {
      next(e)
    }
  })

  // Mark a message as read
  router.post('/:id/read', async (req, res, next) => {
    try {
      const { id } = req.params
      const { to } = req.body || {}
      if (!id || !to) return res.status(400).json({ error: 'id and to are required' })
      if (!store.messages || !store.messages.markRead) return res.status(500).json({ error: 'Messages not supported' })
      await store.messages.markRead(id, to)
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  return router
}
