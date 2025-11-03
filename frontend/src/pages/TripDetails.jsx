import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { API_BASE } from '../lib/api'

const TripDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isConnected, walletAddress, addJoinedTrip, userProfile } = useWallet()
  const [trip, setTrip] = useState(null)
  const [participants, setParticipants] = useState([])
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [error, setError] = useState('')
  const totalCollected = (trip ? (trip.participants || 0) * Number(trip.amount || 0) : 0)
  const meetsMinFund = trip ? Number(trip.minFund || 0) > 0 && totalCollected >= Number(trip.minFund || 0) : false

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        const resp = await fetch(`${API_BASE}/api/trips/${id}`)
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.error || 'Failed to load')
        setTrip(data)
        const presp = await fetch(`${API_BASE}/api/trips/${id}/participants`)
        const pdata = await presp.json()
        const plist = Array.isArray(pdata) ? pdata : []
        setParticipants(plist.map(p => ({ name: p.name || (p.walletAddress.substring(0, 8) + '...'), checkedIn: true })))
      } catch (e) {
        setError('Failed to load trip')
      }
    }
    load()
  }, [id])

  const handleCheckIn = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to check-in')
      navigate('/login')
      return
    }
    if (trip && trip.status && trip.status !== 'open') {
      alert('Trip is not open for check-in')
      return
    }
    try {
      // Ensure Petra is available
      const w = typeof window !== 'undefined' ? window : undefined
      if (!w || !w.aptos) {
        alert('Petra wallet is not installed. Please install Petra and try again.')
        return
      }

      // Build on-chain payment: transfer APT to organizer
      let recipient = trip?.organizer
      if (!recipient) {
        alert('Organizer address not available for payment.')
        return
      }
      // Normalize and validate Aptos address
      const strip0x = String(recipient).startsWith('0x') ? String(recipient).slice(2) : String(recipient)
      const isHex = /^[0-9a-fA-F]+$/.test(strip0x)
      if (!isHex || strip0x.length === 0) {
        alert('Organizer address is not a valid hex Aptos address. Please contact the organizer or try another trip.')
        return
      }
      const evenHex = strip0x.length % 2 === 1 ? '0' + strip0x : strip0x
      recipient = '0x' + evenHex.toLowerCase()
      const amountApt = Number(trip?.amount) || 0
      // Convert APT to octas (1 APT = 1e8 octas)
      const octas = Math.floor(amountApt * 1e8)
      if (octas <= 0) {
        alert('Invalid trip amount for on-chain payment.')
        return
      }

      const payload = {
        type: 'entry_function_payload',
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [recipient, String(octas)],
      }

      // Request Petra to sign and submit transaction
      const tx = await w.aptos.signAndSubmitTransaction(payload)

      const resp = await fetch(`${API_BASE}/api/trips/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, name: userProfile?.username || null, txHash: tx?.hash || null, amountOctas: String(octas), status: 'success', network: 'unknown' })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Check-in failed')
      setHasCheckedIn(true)
      const newParticipant = { name: userProfile?.username || (walletAddress.substring(0, 8) + '...'), checkedIn: true }
      setParticipants([...participants, newParticipant])
      if (trip) {
        addJoinedTrip({ ...trip, participants: (trip.participants || 0) + 1 })
      }
      alert('✅ Check-in successful!')
    } catch (e) {
      try {
        const w = typeof window !== 'undefined' ? window : undefined
        if (w && w.aptos && trip) {
          const recipient = trip.organizer
          const amountApt = Number(trip?.amount) || 0
          const octas = Math.floor(amountApt * 1e8)
          await fetch(`${API_BASE}/api/trips/${id}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, name: userProfile?.username || null, txHash: null, amountOctas: String(octas), status: 'failed', network: 'unknown' })
          })
        }
      } catch {}
      alert('Check-in failed')
    }
  }

  const isOrganizer = trip && walletAddress === trip.organizer

  const handleConfirm = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/trips/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to confirm')
      setTrip({ ...trip, status: 'closed' })
      alert('Trip confirmed and registrations closed')
    } catch (e) {
      alert(e?.message || 'Failed to confirm trip')
    }
  }

  const handleCancel = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/trips/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to cancel')
      setTrip({ ...trip, status: 'canceled' })
      alert('Trip canceled; refunds will be processed')
    } catch (e) {
      alert(e?.message || 'Failed to cancel trip')
    }
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">Loading trip details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/join')}
          className="mb-6 text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Trips
        </button>

        {/* Trip Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{trip.title}</h1>
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              trip.type === 'universal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {trip.type === 'universal' ? 'Public Trip' : 'Private Trip'}
            </span>
            {isOrganizer && (
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                👑 Organizer
              </span>
            )}
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
              Status: {trip.status || 'open'}
            </span>
          </div>

          {/* Trip Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <div className="text-sm text-gray-600">Destination</div>
                  <div className="text-lg font-semibold text-gray-900">{trip.destination}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <div className="text-sm text-gray-600">Trip Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(trip.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🏁</span>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(trip.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">💰</span>
                <div>
                  <div className="text-sm text-gray-600">Amount per Person</div>
                  <div className="text-lg font-semibold text-gray-900">${trip.amount}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🎯</span>
                <div>
                  <div className="text-sm text-gray-600">Minimum Fund to Confirm</div>
                  <div className="text-lg font-semibold text-gray-900">${trip.minFund || 0}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">⏰</span>
                <div>
                  <div className="text-sm text-gray-600">Payment Last Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(trip.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">👤</span>
                <div>
                  <div className="text-sm text-gray-600">Organizer</div>
                  <div className="text-lg font-semibold text-gray-900">{trip.organizerName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About This Trip</h2>
            <p className="text-gray-600">{trip.description}</p>
          </div>

          {/* Participants */}
          <div className="mb-8 p-6 bg-primary-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Currently Checked-in People: {participants.length}
            </h2>
            <div className="mb-4">
              <div className="w-full bg-white rounded h-3 border">
                <div
                  className={`h-3 rounded ${meetsMinFund ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(100, trip && trip.minFund > 0 ? Math.floor((totalCollected / Math.max(1, trip.minFund)) * 100) : 0)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Collected: ${totalCollected.toFixed(2)} {trip?.minFund ? `(Target: $${Number(trip.minFund).toFixed(2)})` : ''}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="bg-white px-4 py-2 rounded-full shadow text-sm font-medium text-gray-900 border-2 border-primary-200"
                >
                  👤 {participant.name}
                </div>
              ))}
            </div>
          </div>

          {/* Check-in Button - Only show if not organizer */}
          {!isOrganizer && (
            <>
              {/* Refund Policy Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-3">💰</span>
                  <div className="text-sm text-yellow-800">
                    <strong>Refund Policy:</strong> Payments cannot be refunded once deposited, unless the trip is canceled due to insufficient funds or organizer cancellation.
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCheckIn}
                  disabled={hasCheckedIn || (trip && trip.status && trip.status !== 'open')}
                  className={`flex-1 font-semibold py-4 px-6 rounded-lg transition ${
                    hasCheckedIn || (trip && trip.status && trip.status !== 'open')
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  } text-white`}
                >
                  {hasCheckedIn ? '✓ Already Checked In' : (trip && trip.status && trip.status !== 'open') ? 'Not Open' : 'Check-in'}
                </button>
              </div>

              {!isConnected && (
                <p className="text-center text-gray-600 mt-4 text-sm">
                  Connect your wallet to check-in and participate in this trip
                </p>
              )}
            </>
          )}

          {isOrganizer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-green-800 font-semibold">Organizer Controls</div>
                  <div className="text-green-700 text-sm mt-1">Confirm when minimum funds are reached or cancel to refund participants.</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={trip && trip.status !== 'open'}
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${trip && trip.status !== 'open' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Confirm Trip
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={trip && trip.status !== 'open'}
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${trip && trip.status !== 'open' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    Cancel Trip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripDetails

