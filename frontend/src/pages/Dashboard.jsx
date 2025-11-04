import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { API_BASE } from '../lib/api'

const Dashboard = () => {
  const { isConnected, walletAddress } = useWallet()
  const [createdTrips, setCreatedTrips] = useState([])
  const [joinedTrips, setJoinedTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBug, setShowBug] = useState(false)
  const [bugText, setBugText] = useState('')
  const [bugSending, setBugSending] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!isConnected || !walletAddress) return
      setLoading(true)
      setError('')
      try {
        const [cResp, jResp] = await Promise.all([
          fetch(`${API_BASE}/api/trips/organizer/${walletAddress}`),
          fetch(`${API_BASE}/api/trips/participant/${walletAddress}`),
        ])
        const [cData, jData] = await Promise.all([cResp.json(), jResp.json()])
        if (!cResp.ok) throw new Error(cData?.error || 'Failed to load created trips')
        if (!jResp.ok) throw new Error(jData?.error || 'Failed to load joined trips')
        setCreatedTrips(Array.isArray(cData) ? cData : [])
        setJoinedTrips(Array.isArray(jData) ? jData : [])
      } catch (e) {
        setError(e?.message || 'Failed to load trips')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isConnected, walletAddress])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">You need to connect your wallet to access your dashboard.</p>
          <Link
            to="/login"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/create"
            className="bg-primary-600 hover:bg-primary-700 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-2xl font-bold mb-2">Create a Trip</h2>
            <p className="text-primary-100">Start planning your next adventure</p>
          </Link>

          <Link
            to="/join"
            className="bg-green-600 hover:bg-green-700 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Join a Trip</h2>
            <p className="text-green-100">Explore available trips to join</p>
          </Link>
        </div>

        {/* My Created Trips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 My Created Trips</h2>
          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow text-center">Loading...</div>
          ) : createdTrips.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-600 text-lg">You haven't created any trips yet.</p>
              <p className="text-gray-500">Start by creating your first trip!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {createdTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`${trip.type === 'private' ? `/trip/code/${trip.code}` : `/trip/${trip.id}`}`}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.type === 'universal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trip.type === 'universal' ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="space-y-2 text-gray-600">
                    <p>📍 {trip.destination}</p>
                    <p>📅 {new Date(trip.date).toLocaleDateString()}</p>
                    <p>💰 ${trip.amount}</p>
                    <p>👥 {trip.participants || 0} participants</p>
                    {trip.endDate && <p>🏁 Ends: {new Date(trip.endDate).toLocaleDateString()}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Joined Trips */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 My Joined Trips</h2>
          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow text-center">Loading...</div>
          ) : joinedTrips.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow text-center">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-gray-600 text-lg">You haven't joined any trips yet.</p>
              <p className="text-gray-500">Explore available trips and join an adventure!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {joinedTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`${trip.type === 'private' ? `/trip/code/${trip.code}` : `/trip/${trip.id}`}`}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.type === 'universal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trip.type === 'universal' ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="space-y-2 text-gray-600">
                    <p>📍 {trip.destination}</p>
                    <p>📅 {new Date(trip.date).toLocaleDateString()}</p>
                    <p>💰 ${trip.amount}</p>
                    <p>👥 {trip.participants || 0} participants</p>
                    {trip.endDate && <p>🏁 Ends: {new Date(trip.endDate).toLocaleDateString()}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bug Report Button */}
      <button
        onClick={() => setShowBug(true)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg px-5 py-3 font-semibold"
        aria-label="Report a bug"
      >
        🐞 Report a bug
      </button>

      {/* Bug Report Modal */}
      {showBug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Report a bug</h2>
            <textarea
              value={bugText}
              onChange={(e) => setBugText(e.target.value)}
              rows={6}
              placeholder="Describe the bug you encountered..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button onClick={() => { setShowBug(false); setBugText('') }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
              <button
                disabled={!bugText || bugSending || !walletAddress}
                onClick={async () => {
                  if (!bugText || !walletAddress) return
                  setBugSending(true)
                  try {
                    const resp = await fetch(`${API_BASE}/api/messages`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ from: walletAddress, to: 'admin', type: 'bug', subject: 'Bug report', body: bugText })
                    })
                    if (!resp.ok) throw new Error((await resp.json())?.error || 'Failed to send bug report')
                    setShowBug(false)
                    setBugText('')
                    alert('Bug report sent. Thank you!')
                  } catch (e) {
                    alert(e?.message || 'Failed to send bug report')
                  } finally {
                    setBugSending(false)
                  }
                }}
                className={`px-4 py-2 rounded ${bugSending ? 'bg-primary-300' : 'bg-primary-600 hover:bg-primary-700'} text-white`}
              >
                {bugSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

