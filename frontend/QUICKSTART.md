# TrustTrip Quick Start Guide

## 🚀 Getting Started in 30 Seconds

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start the development server
npm run dev

# 3. Open your browser to http://localhost:5173
```

That's it! The app is now running.

## 🎯 What to Try

### 1. Explore the Home Page
- Read about TrustTrip
- Check out "How It Works" section
- Click "Login" or "Explore Trips"

### 2. Connect a Mock Wallet
- Navigate to Login page
- Click "Connect Mock Wallet (Demo)"
- You'll be redirected to Dashboard

### 3. Browse Public Trips
- Go to Join Trip page
- Browse Universal Trips section
- Click "View Trip" on any trip
- See trip details, participants, and check-in option

### 4. Join a Private Trip
- Go to Join Trip page
- In Private Trip section, enter one of these codes:
  - `BEACH2024` (Beach Party Weekend)
  - `ADVENTURE123` (Mountain Hiking)
- Click "Join Trip"

### 5. Create Your Own Trip
- Go to Create Trip page
- Fill out the form:
  - Trip Title, Description, Destination
  - Trip Date, Amount per person
  - Funding Deadline
  - Type (Universal or Private)
- Click "Create Trip"
- Confirm in the modal

### 6. Check-in to a Trip
- Visit any trip details page
- Click "Check-in" button
- Wait for confirmation
- See your name appear in participants list

## 🎨 Design Features

- **Responsive**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, minimal design with Tailwind CSS
- **Blue Theme**: Professional primary blue color scheme
- **Smooth Routing**: Seamless navigation between pages
- **Mock Data**: Pre-populated with sample trips for testing

## 🔧 Development

### File Structure
```
src/
├── components/        # Layout components
├── context/          # Wallet context
├── pages/            # Page components
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CreateTrip.jsx
│   ├── JoinTrip.jsx
│   ├── TripDetails.jsx
│   └── PrivateTrip.jsx
├── App.jsx           # Router configuration
└── main.jsx          # Entry point
```

### Routes
- `/` - Home
- `/login` - Wallet connection
- `/dashboard` - User dashboard
- `/create` - Create trip form
- `/join` - Browse and join trips
- `/trip/:id` - Universal trip details
- `/trip/code/:code` - Private trip details

## 🚦 Current Status

✅ All pages implemented
✅ Mock wallet authentication
✅ Mock trip data
✅ Responsive design
✅ Routing configured
✅ Modern UI with Tailwind CSS

## 🔜 Next Steps

1. Integrate real Petra Wallet
2. Connect to Aptos smart contracts
3. Implement real blockchain payments
4. Add on-chain data storage
5. Deploy to production

## 📝 Notes

- All data is currently mocked for demonstration
- Wallet connection is simulated
- Check-in uses simulated payments
- Ready for blockchain integration!

