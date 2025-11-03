import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectMongo } from '../store/mongo.js'

// This script clears the trusttrip database collections: users, trips, participants, transactions
// Use ONLY in development. Requires MONGODB_URI in environment.

dotenv.config()

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is required in environment')
    process.exit(1)
  }
  await connectMongo(uri)
  const conn = mongoose.connection
  const db = conn.db
  const colls = ['users', 'trips', 'participants', 'transactions']
  for (const c of colls) {
    try {
      await db.collection(c).deleteMany({})
      console.log(`Cleared ${c}`)
    } catch (e) {
      console.warn(`Failed clearing ${c}:`, e?.message || e)
    }
  }
  await conn.close()
  console.log('Done')
}

main().catch(async (e) => {
  console.error('Error:', e)
  try { await mongoose.connection.close() } catch {}
  process.exit(1)
})
