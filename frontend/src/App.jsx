import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateTrip from './pages/CreateTrip'
import JoinTrip from './pages/JoinTrip'
import TripDetails from './pages/TripDetails'
import PrivateTrip from './pages/PrivateTrip'
import WalletVerify from './pages/WalletVerify'

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<WalletVerify />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateTrip />} />
            <Route path="/join" element={<JoinTrip />} />
            <Route path="/trip/:id" element={<TripDetails />} />
            <Route path="/trip/code/:code" element={<PrivateTrip />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  )
}

export default App

