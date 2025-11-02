import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const Dashboard = () => {
  const { isConnected, createdTrips, joinedTrips } = useWallet()

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
          {createdTrips.length === 0 ? (
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
          {joinedTrips.length === 0 ? (
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
    </div>
  )
}

export default Dashboard

