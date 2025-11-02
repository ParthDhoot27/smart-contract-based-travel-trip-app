import express from 'express'

export default function createUsersRouter(store) {
  const router = express.Router()

  router.get('/:walletAddress', async (req, res, next) => {
    try {
      const { walletAddress } = req.params
      const row = await store.users.getByWallet(walletAddress)
      if (!row) return res.status(404).json({ error: 'User not found' })
      res.json(row)
    } catch (e) {
      next(e)
    }
  })

  router.put('/:walletAddress', async (req, res, next) => {
    try {
      const { walletAddress } = req.params
      const { username, profileImage, age } = req.body
      const row = await store.users.upsert({ walletAddress, username, profileImage, age })
      res.json(row)
    } catch (e) {
      next(e)
    }
  })

  return router
}
