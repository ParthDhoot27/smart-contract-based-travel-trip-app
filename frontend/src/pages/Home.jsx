import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            TrustTrip
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Plan trips transparently with blockchain trust ✈️
          </p>
          <p className="text-lg mb-12 text-primary-100 max-w-2xl mx-auto">
            Decentralized trip crowdfunding and participation platform built on Aptos blockchain. 
            Create, join, and track trips with complete transparency and trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Login
            </Link>
            <Link
              to="/join"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Explore Trips
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-6 bg-primary-50 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create</h3>
              <p className="text-gray-600">
                Create your trip, set details, destination, date, and funding goal. 
                Choose between universal or private access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6 bg-primary-50 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Join</h3>
              <p className="text-gray-600">
                Browse public trips or join private trips with a unique code. 
                Review details and check-in to participate.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6 bg-primary-50 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check-in</h3>
              <p className="text-gray-600">
                Confirm your participation with a secure blockchain transaction. 
                See real-time participant count as people join.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

