import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const UpdateProfile = () => {
  const { walletAddress, userProfile, setProfile } = useWallet()
  const navigate = useNavigate()
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
  const [age, setAge] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        username: userProfile.username || '',
        profileImage: userProfile.profileImage || null,
      })
    }
    // Mock fetching age from wallet (in production, this would be an actual blockchain call)
    fetchAgeFromWallet()
  }, [userProfile])

  const fetchAgeFromWallet = () => {
    // Mock: Simulate fetching age from blockchain
    // In production: Call smart contract to get user age
    const mockAge = Math.floor(Math.random() * 40) + 18 // Random age 18-58
    setAge(mockAge)
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

  const handleSave = () => {
    if (profileData.username) {
      setProfile({
        username: profileData.username,
        profileImage: profileData.profileImage,
      })
      alert('✅ Profile updated successfully!')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Update Profile</h1>

        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          {/* Wallet Address Display */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-primary-700 font-medium mb-1">Connected Wallet</div>
                <div className="text-primary-900 font-mono text-sm">
                  {walletAddress?.substring(0, 10)}...{walletAddress?.substring(38)}
                </div>
              </div>
              <div className="text-3xl">🔗</div>
            </div>
          </div>

          {/* Age from Wallet */}
          {age !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 font-medium mb-1">Age (from Wallet)</div>
                  <div className="text-blue-900 font-bold text-xl">{age} years</div>
                </div>
                <div className="text-3xl">🎂</div>
              </div>
            </div>
          )}

          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {profileData.profileImage ? (
                <img
                  src={profileData.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-primary-200 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-primary-200 bg-gray-100 flex items-center justify-center">
                  <span className="text-6xl">👤</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
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

          {/* Save Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!profileData.username}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Save Changes
            </button>
          </div>
        </div>
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
    </div>
  )
}

export default UpdateProfile

