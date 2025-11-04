import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { API_BASE } from '../lib/api'

const Inbox = () => {
  const { isConnected, walletAddress } = useWallet()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!isConnected || !walletAddress) return
      setLoading(true)
      setError('')
      try {
        const resp = await fetch(`${API_BASE}/api/messages/inbox/${walletAddress}`)
        const contentType = resp.headers.get('content-type') || ''
        let data = null
        if (contentType.includes('application/json')) {
          data = await resp.json()
        } else {
          const txt = await resp.text()
          if (!resp.ok) throw new Error(txt || 'Failed to load inbox')
          try { data = JSON.parse(txt) } catch { data = [] }
        }
        if (!resp.ok) throw new Error((data && data.error) || 'Failed to load inbox')
        setMessages(Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : [])
      } catch (e) {
        setError(e?.message || 'Failed to load inbox')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isConnected, walletAddress])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Connect your wallet to view Inbox</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Inbox</h1>
        {loading ? (
          <div className="bg-white p-6 rounded-xl shadow">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl">{error}</div>
        ) : messages.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-gray-600">No messages</div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-xl shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">From: {m.from}</div>
                  <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{m.type}</div>
                </div>
                {m.subject && <div className="font-semibold mb-1 text-gray-900">{m.subject}</div>}
                <div className="text-gray-700 whitespace-pre-wrap">{m.body}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Inbox
