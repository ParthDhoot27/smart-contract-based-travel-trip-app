import { connectMongo, users as mongoUsers, trips as mongoTrips } from './mongo.js'

export async function initStore() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is required. Remove SQLite fallback and set MongoDB Atlas URI in .env')
  }
  await connectMongo(uri)
  return { users: mongoUsers, trips: mongoTrips, driver: 'mongo' }
}
