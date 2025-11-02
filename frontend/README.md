# TrustTrip - Decentralized Trip Organizer

TrustTrip is a modern, minimalistic, and responsive React frontend for a decentralized trip crowdfunding and participation app built on the Aptos blockchain.

## Features

- ✈️ **Trip Management**: Create, join, and track trips with complete transparency
- 🔒 **Wallet Authentication**: Mock Petra Wallet integration (ready for blockchain connection)
- 🎯 **Dual Trip Types**: Universal (public) and Private (code-based) trips
- 💰 **Funding System**: Set amounts and track participants
- ✅ **Check-in System**: Secure blockchain-based check-in (mocked for now)
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **React 18** - UI Framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Aptos Blockchain** - (Ready for integration)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
trusttrip/
├── src/
│   ├── components/       # Reusable components
│   │   └── Layout.jsx   # Main layout with navbar and footer
│   ├── context/          # React Context
│   │   └── WalletContext.jsx  # Wallet state management
│   ├── pages/            # Page components
│   │   ├── Home.jsx          # Landing page
│   │   ├── Login.jsx         # Wallet login
│   │   ├── Dashboard.jsx     # User dashboard
│   │   ├── CreateTrip.jsx    # Create trip form
│   │   ├── JoinTrip.jsx      # Browse and join trips
│   │   ├── TripDetails.jsx   # Universal trip details
│   │   └── PrivateTrip.jsx   # Private trip details
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── postcss.config.js     # PostCSS configuration
```

## Routes

- `/` - Home page
- `/login` - Wallet login page
- `/dashboard` - User dashboard
- `/create` - Create a new trip
- `/join` - Browse and join trips
- `/trip/:id` - Universal trip details
- `/trip/code/:code` - Private trip details by code

## Testing

### Mock Data

The app uses mock data for demonstration:

**Universal Trips:**
- ID: 1 - Summer in Tokyo
- ID: 2 - European Adventure
- ID: 3 - Bali Retreat

**Private Trip Codes:**
- `BEACH2024` - Beach Party Weekend
- `ADVENTURE123` - Mountain Hiking

Try entering these codes in the Join Trip page!

### Wallet Simulation

The wallet connection is simulated. Click "Connect Wallet" to generate a mock address for testing.

## Future Integration Points

1. **Petra Wallet**: Replace mock wallet connection with real Petra Wallet integration
2. **Smart Contract**: Connect to Aptos smart contracts for on-chain data
3. **Payment**: Implement real blockchain payments for check-in
4. **Authentication**: Add wallet-based user authentication
5. **Data Storage**: Move trip data from mock to blockchain storage

## Development Notes

- Mock data is currently used for all trips and participants
- Wallet connection is simulated for demonstration purposes
- All payment transactions are mocked
- Ready for full Aptos blockchain integration

## License

MIT License

