import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const Layout = ({ children }) => {
  const { isConnected, walletAddress, connectWallet, disconnectWallet } = useWallet()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">✈️ TrustTrip</span>
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/create" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Create
                </Link>
                <Link to="/join" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Join
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Profile
                  </Link>
                  <span className="text-sm text-gray-600">
                    {walletAddress?.substring(0, 6)}...{walletAddress?.substring(38)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            &copy; 2024 TrustTrip. Built on Aptos blockchain.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout

