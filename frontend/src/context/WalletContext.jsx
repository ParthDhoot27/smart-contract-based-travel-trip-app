import { createContext, useContext, useState } from 'react'

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
    return finalAddress
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setIsConnected(false)
    setCreatedTrips([])
    setJoinedTrips([])
    setUserProfile(null)
  }

  const addCreatedTrip = (trip) => {
    setCreatedTrips([...createdTrips, trip])
  }

  const addJoinedTrip = (trip) => {
    setJoinedTrips([...joinedTrips, trip])
  }

  const setProfile = (profile) => {
    setUserProfile(profile)
  }

  const value = {
    walletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
    createdTrips,
    joinedTrips,
    addCreatedTrip,
    addJoinedTrip,
    userProfile,
    setProfile,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

