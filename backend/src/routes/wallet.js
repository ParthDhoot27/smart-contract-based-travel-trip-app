import express from 'express'
import { deriveProfileFromWallet } from '../utils/wallet.js'

export default function createWalletRouter() {
  const router = express.Router()

  router.get('/:walletAddress/profile', async (req, res) => {
    const { walletAddress } = req.params
    const prof = deriveProfileFromWallet(walletAddress)
    if (!prof) return res.status(400).json({ error: 'Invalid wallet address' })
    return res.json(prof)
  })

  return router
}
