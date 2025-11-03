import mongoose from 'mongoose'
import { customAlphabet } from 'nanoid'

const nano = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)

const userSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    username: String,
    fullName: String,
    profileImage: String,
    age: Number,
    locked: { type: Boolean, default: false },
    createdTrips: { type: [String], default: [] },
    joinedTrips: { type: [String], default: [] },
  },
  { timestamps: true }
)

const tripSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    destination: { type: String, required: true },
    date: { type: String, required: true },
    endDate: { type: String, required: true },
    amount: { type: Number, required: true },
    deadline: { type: String, required: true },
    type: { type: String, enum: ['universal', 'private'], required: true },
    code: { type: String, unique: true, sparse: true },
    organizer: { type: String, required: true },
    organizerName: String,
    minFund: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed', 'confirmed', 'canceled'], default: 'open', index: true },
  },
  { timestamps: true }
)

const participantSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true },
    name: { type: String },
  },
  { timestamps: { createdAt: 'joinedAt', updatedAt: false } }
)
participantSchema.index({ tripId: 1, walletAddress: 1 }, { unique: true })

const transactionSchema = new mongoose.Schema(
  {
    tripId: { type: String, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    amountOctas: { type: String, required: true },
    status: { type: String, enum: ['submitted', 'success', 'failed'], required: true },
    hash: { type: String },
    network: { type: String, default: 'unknown' },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model('User', userSchema)
const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema)
const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema)
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)

export async function connectMongo(uri) {
  if (!uri) return null
  await mongoose.connect(uri, { dbName: 'trusttrip' })
  return mongoose.connection
}

export const users = {
  async getByWallet(walletAddress) {
    const doc = await User.findOne({ walletAddress }).lean()
    if (!doc) return null
    return {
      walletAddress: doc.walletAddress,
      username: doc.username || null,
      fullName: doc.fullName || null,
      profileImage: doc.profileImage || null,
      age: doc.age ?? null,
      locked: !!doc.locked,
      createdTrips: Array.isArray(doc.createdTrips) ? doc.createdTrips : [],
      joinedTrips: Array.isArray(doc.joinedTrips) ? doc.joinedTrips : [],
    }
  },
  async upsert({ walletAddress, username, profileImage, age }) {
    await User.updateOne(
      { walletAddress },
      { $set: { username: username || null, profileImage: profileImage || null, age: Number.isInteger(age) ? age : null } },
      { upsert: true }
    )
    return this.getByWallet(walletAddress)
  },
  async register({ walletAddress, fullName, age }) {
    const existing = await User.findOne({ walletAddress }).lean()
    if (existing && existing.locked) {
      const err = new Error('PROFILE_LOCKED')
      err.code = 'PROFILE_LOCKED'
      throw err
    }
    await User.updateOne(
      { walletAddress },
      {
        $set: {
          fullName: fullName || null,
          username: fullName || null,
          age: Number.isInteger(age) ? age : null,
          locked: true,
        },
        $setOnInsert: { createdTrips: [], joinedTrips: [] },
      },
      { upsert: true }
    )
    return this.getByWallet(walletAddress)
  },
}

const mapTrip = (t, participants) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  destination: t.destination,
  date: t.date,
  endDate: t.endDate,
  amount: t.amount,
  deadline: t.deadline,
  type: t.type,
  code: t.code || null,
  organizer: t.organizer,
  organizerName: t.organizerName || null,
  minFund: typeof t.minFund === 'number' ? t.minFund : 0,
  status: t.status || 'open',
  participants: participants ?? undefined,
})

export const trips = {
  async listPublic() {
    const docs = await Trip.find({ type: 'universal' }).sort({ createdAt: -1 }).lean()
    const ids = docs.map((d) => d.id)
    const counts = await Participant.aggregate([
      { $match: { tripId: { $in: ids } } },
      { $group: { _id: '$tripId', c: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((c) => [c._id, c.c]))
    return docs.map((d) => mapTrip(d, countMap.get(d.id) || 0))
  },
  async listByOrganizer(walletAddress) {
    const docs = await Trip.find({ organizer: walletAddress }).sort({ createdAt: -1 }).lean()
    const ids = docs.map((d) => d.id)
    if (ids.length === 0) return []
    const counts = await Participant.aggregate([
      { $match: { tripId: { $in: ids } } },
      { $group: { _id: '$tripId', c: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((c) => [c._id, c.c]))
    return docs.map((d) => mapTrip(d, countMap.get(d.id) || 0))
  },
  async listByParticipant(walletAddress) {
    const parts = await Participant.find({ walletAddress }).lean()
    const ids = parts.map((p) => p.tripId)
    if (ids.length === 0) return []
    const docs = await Trip.find({ id: { $in: ids } }).lean()
    const counts = await Participant.aggregate([
      { $match: { tripId: { $in: ids } } },
      { $group: { _id: '$tripId', c: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((c) => [c._id, c.c]))
    // Keep response in a stable order (most recent join first based on Participant.joinedAt)
    const order = new Map(ids.map((id, idx) => [id, idx]))
    return docs
      .map((d) => mapTrip(d, countMap.get(d.id) || 0))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  },
  async getById(id) {
    const t = await Trip.findOne({ id }).lean()
    if (!t) return null
    const participants = await Participant.countDocuments({ tripId: id })
    return mapTrip(t, participants)
  },
  async getByCode(code) {
    const t = await Trip.findOne({ code }).lean()
    if (!t) return null
    const participants = await Participant.countDocuments({ tripId: t.id })
    return mapTrip(t, participants)
  },
  async create(doc) {
    const tripId = doc.id || nano()
    try {
      await Trip.create({
        id: tripId,
        title: doc.title,
        description: doc.description,
        destination: doc.destination,
        date: doc.date,
        endDate: doc.endDate,
        amount: Number(doc.amount),
        deadline: doc.deadline,
        type: doc.type,
        code: doc.code || null,
        organizer: doc.organizer,
        organizerName: doc.organizerName || null,
        minFund: Number(doc.minFund || 0),
        status: 'open',
      })
      // add to organizer's createdTrips
      await User.updateOne({ walletAddress: doc.organizer }, { $addToSet: { createdTrips: tripId } })
    } catch (e) {
      if (e && e.code === 11000 && e.keyPattern && e.keyPattern.code) {
        const err = new Error('DUPLICATE_CODE')
        err.code = 'DUPLICATE_CODE'
        throw err
      }
      throw e
    }
    return mapTrip({ ...doc, id: tripId }, 0)
  },
  async checkin(id, walletAddress, name) {
    const t = await Trip.findOne({ id }).lean()
    if (!t) return { notFound: true }
    if (t.status && t.status !== 'open') {
      const err = new Error('TRIP_NOT_OPEN')
      err.code = 'TRIP_NOT_OPEN'
      throw err
    }
    try {
      await Participant.create({ tripId: id, walletAddress, name: name || null })
      await User.updateOne({ walletAddress }, { $addToSet: { joinedTrips: id } })
    } catch (e) {
      if (e && e.code === 11000) {
        return { already: true }
      }
      throw e
    }
    const count = await Participant.countDocuments({ tripId: id })
    return { participants: count }
  },
  async listParticipants(id) {
    const parts = await Participant.find({ tripId: id }).sort({ joinedAt: 1 }).lean()
    return parts.map(p => ({ walletAddress: p.walletAddress, name: p.name || null }))
  },
  async delete(id) {
    // Remove trip, its participants, and references from users
    await Trip.deleteOne({ id })
    const participants = await Participant.find({ tripId: id }).lean()
    const wallets = participants.map(p => p.walletAddress)
    await Participant.deleteMany({ tripId: id })
    if (wallets.length > 0) {
      await User.updateMany({ walletAddress: { $in: wallets } }, { $pull: { joinedTrips: id } })
    }
    // remove from any organizer createdTrips
    await User.updateMany({ createdTrips: id }, { $pull: { createdTrips: id } })
    return { deleted: true }
  },
  async confirm(id, walletAddress) {
    const t = await Trip.findOne({ id }).lean()
    if (!t) return { notFound: true }
    if (t.organizer !== walletAddress) return { forbidden: true }
    await Trip.updateOne({ id }, { $set: { status: 'closed' } })
    return { ok: true, status: 'closed' }
  },
  async cancel(id, walletAddress) {
    const t = await Trip.findOne({ id }).lean()
    if (!t) return { notFound: true }
    if (t.organizer !== walletAddress) return { forbidden: true }
    await Trip.updateOne({ id }, { $set: { status: 'canceled' } })
    return { ok: true, status: 'canceled' }
  },
}

export const transactions = {
  async log({ tripId, from, to, amountOctas, status, hash, network }) {
    await Transaction.create({ tripId: tripId || null, from, to, amountOctas: String(amountOctas), status, hash: hash || null, network: network || 'unknown' })
    return { ok: true }
  },
}
