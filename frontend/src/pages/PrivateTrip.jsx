import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const PrivateTrip = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const { isConnected, walletAddress, addJoinedTrip } = useWallet()
  const [trip, setTrip] = useState(null)
  const [participants, setParticipants] = useState([])
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [isValidCode, setIsValidCode] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        const resp = await fetch(`http://localhost:4000/api/trips/code/${code}`)
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.error || 'Invalid code')
        setTrip(data)
        setIsValidCode(true)
        const presp = await fetch(`http://localhost:4000/api/trips/${data.id}/participants`)
        const pdata = await presp.json()
        const plist = Array.isArray(pdata) ? pdata : []
        setParticipants(plist.map(p => ({ name: p.walletAddress.substring(0, 8) + '...', checkedIn: true })))
      } catch (e) {
        setIsValidCode(false)
        setError('Invalid trip code')
      }
    }
    load()
  }, [code])

  const handleCheckIn = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to check-in')
      navigate('/login')
      return
    }
    try {
      // Ensure Petra is available
      const w = typeof window !== 'undefined' ? window : undefined
      if (!w || !w.aptos) {
        alert('Petra wallet is not installed. Please install Petra and try again.')
        return
      }

      // Build on-chain payment to organizer
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

      await w.aptos.signAndSubmitTransaction(payload)

      const resp = await fetch(`http://localhost:4000/api/trips/${trip.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Check-in failed')
      setHasCheckedIn(true)
      const newParticipant = { name: walletAddress.substring(0, 8) + '...', checkedIn: true }
      setParticipants([...participants, newParticipant])
      if (trip) {
        addJoinedTrip({ ...trip, participants: (trip.participants || 0) + 1 })
      }
      alert('✅ Check-in successful!')
    } catch (e) {
      alert('Check-in failed')
    }
  }

  const isOrganizer = trip && walletAddress === trip.organizer

  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Trip Code</h2>
          <p className="text-gray-600 mb-6">
            The trip code "{code}" is not valid. Please check your code and try again.
          </p>
          <button
            onClick={() => navigate('/join')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg"
          >
            Go to Join Page
          </button>
        </div>
      </div>
    )
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

        {/* Private Trip Badge */}
        <div className="mb-4 bg-purple-100 border border-purple-300 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔒</span>
            <div>
              <div className="font-semibold text-purple-900">Private Trip - Code: {code}</div>
              <div className="text-sm text-purple-700">This trip is only accessible with the code you entered</div>
            </div>
          </div>
        </div>

        {/* Trip Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{trip.title}</h1>
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            {isOrganizer && (
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                👑 Organizer
              </span>
            )}
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
                  disabled={hasCheckedIn}
                  className={`flex-1 font-semibold py-4 px-6 rounded-lg transition ${
                    hasCheckedIn
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  } text-white`}
                >
                  {hasCheckedIn ? '✓ Already Checked In' : 'Check-in'}
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">👑</div>
              <p className="text-green-800 font-semibold">You are the organizer of this trip</p>
              <p className="text-green-700 text-sm mt-1">Manage your trip participants and details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrivateTrip

