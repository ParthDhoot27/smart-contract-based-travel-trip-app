import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api'

const JoinTrip = () => {
  const navigate = useNavigate()
  const [tripCode, setTripCode] = useState('')
  const [universalTrips, setUniversalTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const resp = await fetch(`${API_BASE}/api/trips`)
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.error || 'Failed to load trips')
        setUniversalTrips(Array.isArray(data) ? data : [])
      } catch (e) {
        setError('Failed to load trips')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    if (tripCode.trim()) {
      navigate(`/trip/code/${tripCode}`)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Join a Trip</h1>

        {/* Private Join Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 Join Private Trip</h2>
          <p className="text-gray-600 mb-6">
            Have a trip code? Enter it below to join a private trip.
          </p>
          <form onSubmit={handleCodeSubmit} className="flex gap-4">
            <input
              type="text"
              value={tripCode}
              onChange={(e) => setTripCode(e.target.value)}
              placeholder="Enter trip code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Join Trip
            </button>
          </form>
        </div>

        {/* Universal Trips Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🌟 Universal Trips</h2>
          <p className="text-gray-600 mb-8">
            Browse available public trips and join the adventure!
          </p>

          {universalTrips.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow text-center">
              <div className="text-5xl mb-4">✈️</div>
              <p className="text-gray-600 text-lg">No public trips available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universalTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{trip.title}</h3>
                  <div className="space-y-2 text-gray-600 mb-4">
                    <p>📍 {trip.destination}</p>
                    <p>📅 {new Date(trip.date).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                    <p>💰 ${trip.amount} per person</p>
                    <p>👥 {trip.participants} participants</p>
                    <p className="text-sm text-gray-500">
                      ⏰ Payment Last Date: {new Date(trip.deadline).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-primary-600">
                      👤 Organized by: {trip.organizerName}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    View Trip
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinTrip

