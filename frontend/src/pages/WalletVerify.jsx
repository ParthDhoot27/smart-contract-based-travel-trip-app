import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WalletVerify() {
  const [wallet, setWallet] = useState('')
  const [nonce, setNonce] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const requestNonce = async () => {
    setError('')
    if (!wallet.trim()) return
    setLoading(true)
    try {
      const resp = await fetch(`http://localhost:4000/api/auth/nonce?wallet=${encodeURIComponent(wallet.trim())}`)
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to get nonce')
      setNonce(data.nonce)
    } catch (e) {
      setError(e.message || 'Failed to get nonce')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setError('')
    if (!wallet.trim() || !nonce.trim()) return
    setLoading(true)
    try {
      // NOTE: In production you should sign the nonce with Petra and send the signature.
      // For now we submit the nonce as-is to backend stub.
      const resp = await fetch('http://localhost:4000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.trim(), nonce })
      })
      const data = await resp.json()
      if (!resp.ok || !data?.verified) throw new Error(data?.error || 'Verification failed')
      navigate(`/login?wallet=${encodeURIComponent(wallet.trim())}`)
    } catch (e) {
      setError(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (!nonce) await requestNonce()
      else await verify()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-2">Verify Petra Wallet</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your Petra wallet address to start</p>
        <input
          type="text"
          value={wallet}
          onChange={(e)=>setWallet(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="0x... (Petra wallet address)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
        />
        {nonce ? (
          <div className="mb-3 text-xs break-all p-2 bg-gray-50 border rounded">Nonce: {nonce}</div>
        ) : null}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <div className="flex gap-3">
          <button onClick={requestNonce} disabled={loading || !wallet.trim()} className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition">Get Nonce</button>
          <button onClick={verify} disabled={loading || !wallet.trim() || !nonce.trim()} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition">Verify</button>
        </div>
      </div>
    </div>
  )
}
