import { useMemo, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const Login = () => {
  const { connectWallet, isConnected, setProfile } = useWallet()
  const navigate = useNavigate()
  const location = useLocation()
  const urlWallet = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('wallet') || ''
  }, [location.search])
  const [regFullName, setRegFullName] = useState('')
  const [regAge, setRegAge] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [walletInput, setWalletInput] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [showConfirmPhoto, setShowConfirmPhoto] = useState(false)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [profileData, setProfileData] = useState({
    username: '',
    profileImage: null,
  })
  const fileInputRef = useRef(null)
  const [authError, setAuthError] = useState('')

  const handleConnect = async () => {
    setShowWalletDialog(true)
  }

  // Strict registration view if coming from verification with wallet param
  if (urlWallet) {
    const canSubmit = regFullName.trim().length > 0 && String(regAge).trim().length > 0 && !Number.isNaN(Number(regAge))
    const onSubmit = async (e) => {
      e.preventDefault()
      setIsConnecting(true)
      setAuthError('')
      try {
        // Lock profile on backend
        const resp = await fetch('http://localhost:4000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: urlWallet, fullName: regFullName.trim(), age: Number(regAge) })
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.error || 'Registration failed')
        // Connect wallet only after successful registration
        connectWallet(urlWallet)
        setProfile({ username: data?.user?.username || regFullName.trim(), profileImage: null })
        navigate('/dashboard')
      } catch (e) {
        setAuthError(e.message || 'Registration failed')
      } finally {
        setIsConnecting(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Complete Registration</h2>
          <p className="text-sm text-gray-600 mb-4">Your Petra wallet is verified. Add your details below.</p>
          <div className="mb-3 text-sm">
            <div className="font-semibold">Petra Wallet ID (immutable)</div>
            <div className="mt-1 p-2 bg-gray-100 rounded border text-gray-700 break-all">{urlWallet}</div>
            <div className="text-xs text-red-600 mt-1">Warning: These details cannot be edited later.</div>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input value={regFullName} onChange={(e)=>setRegFullName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input value={regAge} onChange={(e)=>setRegAge(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Age" />
            </div>
            {authError && <div className="text-sm text-red-600">{authError}</div>}
            <button disabled={!canSubmit || isConnecting} className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded">
              {isConnecting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const handleConfirmWallet = async () => {
    if (!walletInput.trim()) return
    setIsConnecting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const addr = walletInput.trim()
      // Step 1: verify Petra wallet ownership (stubbed backend verification)
      const vresp = await fetch('http://localhost:4000/api/auth/petra/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: addr })
      })
      const vdata = await vresp.json()
      if (!vresp.ok || !vdata?.verified) {
        throw new Error(vdata?.error || 'Verification failed')
      }

      // Step 2: perform backend auth/session bootstrap
      const resp = await fetch('http://localhost:4000/api/auth/petra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: addr })
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || 'Login failed')
      }
      // Only mark as connected AFTER successful verification + auth
      connectWallet(addr)
      setProfile({
        username: data?.user?.username || '',
        profileImage: data?.user?.profileImage || null,
      })
      setShowWalletDialog(false)
      setWalletInput('')
      setAuthError('')
      navigate('/dashboard')
    } catch (e) {
      console.error('Auth error:', e)
      setAuthError('Login failed. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOpenCamera = () => {
    setShowCamera(true)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((mediaStream) => {
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      })
      .catch((err) => {
        console.error('Camera error:', err)
        alert('Could not access camera. Please check permissions.')
      })
  }

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/png')
      setCapturedImage(imageData)
      setShowConfirmPhoto(true)
      
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const handleConfirmPhoto = () => {
    setProfileData({ ...profileData, profileImage: capturedImage })
    setShowCamera(false)
    setShowConfirmPhoto(false)
    setCapturedImage(null)
    setStream(null)
  }

  const handleRetakePhoto = () => {
    setShowConfirmPhoto(false)
    setCapturedImage(null)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((mediaStream) => {
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      })
  }

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setShowCamera(false)
    setShowConfirmPhoto(false)
    setCapturedImage(null)
    setStream(null)
  }

  const handleProfileSubmit = () => {
    if (profileData.username) {
      setProfile({
        username: profileData.username,
        profileImage: profileData.profileImage,
      })
      navigate('/dashboard')
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
        {!showProfileSetup ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to TrustTrip
              </h2>
              <p className="text-gray-600">
                Connect your wallet to get started
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {/* Petra Wallet Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting || isConnected}
                className="w-full flex items-center justify-center space-x-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition shadow-lg"
              >
                <span className="text-2xl">🦎</span>
                <span>
                  {isConnecting ? 'Connecting...' : 'Connect Petra Wallet'}
                </span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Mock Wallet Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting || isConnected}
                className="w-full flex items-center justify-center space-x-3 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition shadow-lg"
              >
                <span className="text-2xl">🔷</span>
                <span>
                  {isConnecting ? 'Connecting...' : 'Connect Mock Wallet (Demo)'}
                </span>
              </button>

              <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800">
                  <strong>Note:</strong> This is a demo version. For production, 
                  integrate with Petra Wallet or other Aptos-compatible wallets.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 text-sm">
                Add your information to get started
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-4 border-primary-200 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-primary-200 bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition"
                  >
                    📁 Upload from Gallery
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                  >
                    📷 Click Photo
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  capture="environment"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>

              {/* Submit & Skip */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProfileSubmit}
                  disabled={!profileData.username}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Continue
                </button>
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            {!showConfirmPhoto ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Take a Photo</h3>
                  <button
                    onClick={handleCloseCamera}
                    className="text-white hover:text-gray-300 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-96 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="bg-white p-6 flex justify-center">
                  <button
                    onClick={handleCapturePhoto}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition"
                  >
                    📷 Capture Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Confirm Photo</h3>
                  <button
                    onClick={handleCloseCamera}
                    className="text-white hover:text-gray-300 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-black p-4 flex justify-center">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-h-96 rounded-lg"
                  />
                </div>
                <div className="bg-white p-6 flex gap-3 justify-center">
                  <button
                    onClick={handleRetakePhoto}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    ↺ Retake
                  </button>
                  <button
                    onClick={handleConfirmPhoto}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    ✓ Confirm Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Petra Wallet ID Dialog */}
      {showWalletDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Petra Wallet</h2>
            <p className="text-gray-600 mb-4 text-sm">Enter your Petra wallet address to continue</p>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder="0x... (Petra wallet address)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
            />
            {authError && (
              <div className="text-red-600 text-sm mb-3">{authError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowWalletDialog(false); setAuthError(''); }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWallet}
                disabled={isConnecting || !walletInput.trim()}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login

