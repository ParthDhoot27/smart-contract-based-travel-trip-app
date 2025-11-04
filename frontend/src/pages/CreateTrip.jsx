import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { API_BASE } from '../lib/api'

const CreateTrip = () => {
  const { isConnected, walletAddress, userProfile, addCreatedTrip } = useWallet()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showAgeDialog, setShowAgeDialog] = useState(false)
  const [tripCode, setTripCode] = useState('')
  const [tempAgeLimit, setTempAgeLimit] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    date: '',
    amount: '',
    deadline: '',
    endDate: '',
    type: 'universal',
    codeOption: 'auto', // 'auto' or 'custom'
    hasAgeRestriction: false,
    ageLimit: null,
    minFund: '',
    whatsappLink: '',
    discordLink: '',
    initialDepositApt: '',
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    
    // Handle age restriction checkbox
    if (name === 'hasAgeRestriction' && checked) {
      setShowAgeDialog(true)
    }
  }

  const handleAgeLimitConfirm = () => {
    if (tempAgeLimit && parseInt(tempAgeLimit) > 0) {
      setFormData({
        ...formData,
        ageLimit: parseInt(tempAgeLimit)
      })
      setShowAgeDialog(false)
      setTempAgeLimit('')
    }
  }

  const handleAgeRestrictionRemove = () => {
    setFormData({
      ...formData,
      hasAgeRestriction: false,
      ageLimit: null
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowModal(true)
  }

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const [creating, setCreating] = useState(false)
  const handleConfirm = async () => {
    if (creating) return
    setCreating(true)
    try {
      // Validate mandatory initial deposit for universal trips: >= 2x per-member cost
      if (formData.type === 'universal') {
        const amountNum = Number(formData.amount)
        const depositNum = Number(formData.initialDepositApt)
        if (!depositNum || depositNum < amountNum * 2) {
          throw new Error('Initial deposit must be at least 2x the per-member cost (APT).')
        }
      }
      const code = formData.type === 'private' 
        ? (formData.codeOption === 'custom' ? formData.customCode : generateCode())
        : null

      const payload = {
        title: formData.title,
        description: formData.description,
        destination: formData.destination,
        date: formData.date,
        endDate: formData.endDate,
        amount: Number(formData.amount),
        deadline: formData.deadline,
        type: formData.type,
        codeOption: formData.codeOption,
        customCode: formData.codeOption === 'custom' ? formData.customCode : undefined,
        organizer: walletAddress,
        organizerName: userProfile?.username || (walletAddress.substring(0, 8) + '...'),
        minFund: formData.minFund ? Number(formData.minFund) : 0,
        whatsappLink: formData.whatsappLink || undefined,
        discordLink: formData.discordLink || undefined,
        initialDepositOctas: formData.initialDepositApt ? String(Math.floor(Number(formData.initialDepositApt) * 1e8)) : '0',
      }
      const resp = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const created = await resp.json()
      if (!resp.ok) throw new Error(created?.error || 'Failed to create trip')
      addCreatedTrip(created)
      setShowModal(false)
      if (created.type === 'private' && created.code) {
        setTripCode(created.code)
        setShowCodeModal(true)
      } else {
        navigate('/dashboard')
      }
    } catch (e) {
      alert(e?.message || 'Failed to create trip')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/trip/code/${tripCode}`
    navigator.clipboard.writeText(link)
    alert('✅ Trip link copied to clipboard!')
  }
  
  const handleCloseCodeModal = () => {
    setShowCodeModal(false)
    navigate('/dashboard')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">You need to connect your wallet to create a trip.</p>
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a New Trip</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          {/* Trip Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Summer in Tokyo"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your trip..."
            />
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination *
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              required
              value={formData.destination}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Tokyo, Japan"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Start Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              Trip End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              required
              min={formData.date || ''}
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {formData.endDate && formData.date && new Date(formData.endDate) < new Date(formData.date) && (
              <p className="text-red-600 text-sm mt-1">End date must be after start date</p>
            )}

          {/* Social Links */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="whatsappLink" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Group Link
              </label>
              <input
                type="url"
                id="whatsappLink"
                name="whatsappLink"
                value={formData.whatsappLink}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div>
              <label htmlFor="discordLink" className="block text-sm font-medium text-gray-700 mb-2">
                Discord Server Invite
              </label>
              <input
                type="url"
                id="discordLink"
                name="discordLink"
                value={formData.discordLink}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://discord.gg/..."
              />
            </div>
          </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount per Person (USD) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="500.00"
            />
          </div>

          {/* Minimum Fund Required */}
          <div>
            <label htmlFor="minFund" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Fund to Confirm Trip (USD)
            </label>
            <input
              type="number"
              id="minFund"
              name="minFund"
              min="0"
              step="0.01"
              value={formData.minFund}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 1000.00"
            />
            <p className="text-xs text-gray-500 mt-1">Trip can be confirmed when collected funds reach this amount; otherwise organizer can cancel and refund.</p>
          </div>

          {/* Initial Deposit (APT) for Universal Trips */}
          {formData.type === 'universal' && (
            <div>
              <label htmlFor="initialDepositApt" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Deposit (APT) *
              </label>
              <input
                type="number"
                id="initialDepositApt"
                name="initialDepositApt"
                min="0"
                step="0.00000001"
                value={formData.initialDepositApt}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 2.0"
              />
              <p className="text-xs text-gray-600 mt-1">This deposit must be ≥ 2× the minimum per-member cost. It will be held in escrow and returned to you upon trip confirmation.</p>
              <p className="text-xs text-gray-500 mt-1">Note: initial deposits for universal trips are mandatory to make the trip authentic and users assured.</p>
            </div>
          )}

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Last Date *
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              required
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="universal">Universal (Public)</option>
              <option value="private">Private (Code-based)</option>
            </select>
          </div>

          {/* Trip Code Options (only for private trips) */}
          {formData.type === 'private' && (
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Trip Code Option
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="codeOption"
                    value="auto"
                    checked={formData.codeOption === 'auto'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Auto-generated code</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="codeOption"
                    value="custom"
                    checked={formData.codeOption === 'custom'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Custom code</span>
                </label>
                {formData.codeOption === 'custom' && (
                  <input
                    type="text"
                    name="customCode"
                    value={formData.customCode || ''}
                    onChange={handleChange}
                    placeholder="Enter custom code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                )}
              </div>
            </div>
          )}

          {/* Age Restriction (only for universal trips) */}
          {formData.type === 'universal' && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="hasAgeRestriction"
                  checked={formData.hasAgeRestriction}
                  onChange={handleChange}
                  className="mr-3 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  Add age restriction for this trip
                </span>
              </label>
              {formData.hasAgeRestriction && formData.ageLimit && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Minimum age requirement: <strong className="text-gray-900">{formData.ageLimit} years</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAgeRestrictionRemove}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Note */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-600 mr-3">⚠️</span>
              <div className="text-sm text-red-800">
                <strong>Important:</strong> Trip information cannot be changed after creation due to security and transparency reasons. Please review all details carefully before submitting.
                <div className="mt-2">
                  <strong>Cancellation Policy:</strong> If you cancel the trip after funds have met the minimum threshold, <strong>20% of total funds raised will be charged</strong> as a penalty and not returned. If the minimum funds are not met, you can cancel without this penalty and refunds will be processed.
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Create Trip
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Trip Creation</h2>
            <div className="space-y-2 mb-6 text-gray-600">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Destination:</strong> {formData.destination}</p>
              <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ${formData.amount}</p>
              {formData.minFund && <p><strong>Minimum Fund:</strong> ${formData.minFund}</p>}
              <p><strong>Payment Last Date:</strong> {new Date(formData.deadline).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(formData.endDate).toLocaleDateString()}</p>
              <p><strong>Type:</strong> {formData.type === 'universal' ? 'Public' : 'Private'}</p>
              {formData.type === 'private' && (
                <p><strong>Code Option:</strong> {formData.codeOption === 'auto' ? 'Auto-generated' : 'Custom'}</p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Code Modal (for private trips) */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Created Successfully!</h2>
              <p className="text-gray-600">Your private trip is ready to share</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-purple-700 mb-2 font-medium">Trip Code</div>
              <div className="text-2xl font-bold text-purple-900 font-mono">{tripCode}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
              >
                <span className="mr-2">📋</span>
                Copy Trip Link
              </button>
              <button
                onClick={handleCloseCodeModal}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              Share this link with friends to join your private trip
            </p>
          </div>
        </div>
      )}

      {/* Age Limit Dialog */}
      {showAgeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Age Restriction</h2>
            <p className="text-gray-600 mb-6">
              What is the minimum age required for participants?
            </p>
            <input
              type="number"
              value={tempAgeLimit}
              onChange={(e) => setTempAgeLimit(e.target.value)}
              placeholder="Enter minimum age"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-6"
              min="18"
              max="100"
            />
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowAgeDialog(false)
                  setTempAgeLimit('')
                  setFormData({...formData, hasAgeRestriction: false})
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAgeLimitConfirm}
                disabled={!tempAgeLimit || parseInt(tempAgeLimit) < 18}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Set Age Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateTrip

