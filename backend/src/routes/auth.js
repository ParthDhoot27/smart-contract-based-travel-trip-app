import express from 'express'
import { deriveProfileFromWallet } from '../utils/wallet.js'
import { createNonce, consumeNonce, signToken } from '../auth/session.js'

export default function createAuthRouter(store) {
  const router = express.Router()

  // Issue nonce for a wallet (used for signature-based verification later)
  router.get('/nonce', async (req, res) => {
    const wallet = String(req.query.wallet || '').trim()
    if (!wallet) return res.status(400).json({ error: 'wallet is required' })
    const nonce = createNonce(wallet)
    return res.json({ walletAddress: wallet, nonce })
  })

  // Verify signed nonce (signature validation placeholder), return a session token
  router.post('/verify', async (req, res) => {
    const { walletAddress, nonce } = req.body || {}
    if (!walletAddress || !nonce) return res.status(400).json({ error: 'walletAddress and nonce are required' })
    const ok = consumeNonce(walletAddress, nonce)
    if (!ok) return res.status(400).json({ error: 'Invalid or expired nonce' })
    const token = signToken({ walletAddress })
    return res.json({ verified: true, token })
  })

  // Petra verification stub: in production, verify signature/ownership.
  router.post('/petra/verify', async (req, res, next) => {
    try {
      const { walletAddress } = req.body || {}
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ error: 'walletAddress is required' })
      }
      // TODO: verify via Petra (signature/nonce). Here we accept the provided address.
      return res.json({ verified: true, walletAddress })
    } catch (e) {
      next(e)
    }
  })

  // Petra wallet login: accepts walletAddress, returns derived profile and a mock token
  router.post('/petra', async (req, res, next) => {
    try {
      const { walletAddress } = req.body || {}
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ error: 'walletAddress is required' })
      }

      const derived = deriveProfileFromWallet(walletAddress)
      // Optionally cache into DB (username/age may be sourced from wallet on frontend)
      await store.users.upsert({
        walletAddress: derived.walletAddress,
        username: derived.username,
        profileImage: null,
        age: derived.age,
      })

      // Issue a simple mock token (for demo only)
      const token = Buffer.from(`${walletAddress}:${Date.now()}`).toString('base64')

      return res.json({
        user: {
          walletAddress: derived.walletAddress,
          username: derived.username,
          age: derived.age,
          profileImage: null,
        },
        token,
      })
    } catch (e) {
      next(e)
    }
  })

  // Register: full name + age for a verified wallet, lock profile
  router.post('/register', async (req, res, next) => {
    try {
      const { walletAddress, fullName, age } = req.body || {}
      if (!walletAddress || !fullName || typeof age !== 'number') {
        return res.status(400).json({ error: 'walletAddress, fullName, and age are required' })
      }
      const user = await store.users.register({ walletAddress, fullName, age })
      return res.json({ user })
    } catch (e) {
      if (e && e.code === 'PROFILE_LOCKED') {
        return res.status(409).json({ error: 'Profile already locked' })
      }
      next(e)
    }
  })

  return router
}
