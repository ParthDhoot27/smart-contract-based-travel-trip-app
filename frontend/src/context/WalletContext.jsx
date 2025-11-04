import { createContext, useContext, useEffect, useState } from 'react'
import { API_BASE } from '../lib/api'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [createdTrips, setCreatedTrips] = useState([])
  const [joinedTrips, setJoinedTrips] = useState([])
  const [userProfile, setUserProfile] = useState(null)

  const connectWallet = (address) => {
    const finalAddress = address && typeof address === 'string' && address.trim().length > 0
      ? address.trim()
      : '0x' + Math.random().toString(16).substr(2, 40)
    setWalletAddress(finalAddress)
    setIsConnected(true)
    try {
      sessionStorage.setItem('walletAddress', finalAddress)
      sessionStorage.setItem('isConnected', 'true')
    } catch (_) {}
    return finalAddress
  }

  const connectWithPetra = async () => {
    const w = typeof window !== 'undefined' ? window : undefined
    if (!w || !w.aptos) {
      throw new Error('Petra wallet is not installed')
    }
    const res = await w.aptos.connect()
    const addr = res?.address || (await w.aptos.account())?.address
    // Do not mark app state as connected yet; caller will connect after backend auth
    return addr
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setIsConnected(false)
    setCreatedTrips([])
    setJoinedTrips([])
    setUserProfile(null)
    try {
      sessionStorage.removeItem('walletAddress')
      sessionStorage.removeItem('isConnected')
      sessionStorage.removeItem('userProfile')
    } catch (_) {}
  }

  const addCreatedTrip = (trip) => {
    setCreatedTrips([...createdTrips, trip])
  }

  const addJoinedTrip = (trip) => {
    setJoinedTrips([...joinedTrips, trip])
  }

  const setProfile = (profile) => {
    setUserProfile(profile)
    try {
      sessionStorage.setItem('userProfile', JSON.stringify(profile || null))
    } catch (_) {}
  }

  const switchWallet = async () => {
    try {
      const w = typeof window !== 'undefined' ? window : undefined
      if (w && w.aptos && typeof w.aptos.disconnect === 'function') {
        await w.aptos.disconnect()
      }
    } catch (_) {}
    disconnectWallet()
  }

  useEffect(() => {
    try {
      const savedConnected = sessionStorage.getItem('isConnected') === 'true'
      const savedAddr = sessionStorage.getItem('walletAddress')
      const savedProfileStr = sessionStorage.getItem('userProfile')
      const savedProfile = savedProfileStr ? JSON.parse(savedProfileStr) : null
      if (savedConnected && savedAddr) {
        setWalletAddress(savedAddr)
        setIsConnected(true)
      }
      if (savedProfile) {
        setUserProfile(savedProfile)
      }
    } catch (_) {}
    // Subscribe to wallet account change if available
    const w = typeof window !== 'undefined' ? window : undefined
    let offAccount
    try {
      if (w && w.aptos && typeof w.aptos.onAccountChange === 'function') {
        offAccount = w.aptos.onAccountChange((account) => {
          const next = account?.address
          if (next) {
            connectWallet(next)
          } else {
            disconnectWallet()
          }
        })
      }
    } catch (_) {}
    return () => {
      try { if (typeof offAccount === 'function') offAccount() } catch (_) {}
    }
  }, [])

  useEffect(() => {
    // If connected but no profile loaded, fetch it to get username for navbar
    const maybeFetchProfile = async () => {
      if (!isConnected || !walletAddress || userProfile) return
      try {
        const resp = await fetch(`${API_BASE}/api/users/${walletAddress}`)
        if (resp.ok) {
          const u = await resp.json()
          setProfile({ username: u?.username || u?.fullName || '', profileImage: u?.profileImage || null, age: u?.age ?? null })
        }
      } catch (_) {}
    }
    maybeFetchProfile()
  }, [isConnected, walletAddress])

  const value = {
    walletAddress,
    isConnected,
    connectWallet,
    connectWithPetra,
    disconnectWallet,
    createdTrips,
    joinedTrips,
    addCreatedTrip,
    addJoinedTrip,
    userProfile,
    setProfile,
    switchWallet,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

