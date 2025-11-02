// Simple in-memory nonce store and JWT helpers
import jwt from 'jsonwebtoken'

const NONCES = new Map()
const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function createNonce(wallet) {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const exp = Date.now() + NONCE_TTL_MS
  NONCES.set(wallet.toLowerCase(), { nonce, exp })
  return nonce
}

export function consumeNonce(wallet, nonce) {
  const key = wallet.toLowerCase()
  const rec = NONCES.get(key)
  if (!rec) return false
  if (rec.nonce !== nonce) return false
  if (Date.now() > rec.exp) return false
  NONCES.delete(key)
  return true
}

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  // 24h token
  return jwt.sign(payload, secret, { expiresIn: '24h' })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.verify(token, secret)
}
