import db from '../db.js'

const mapTrip = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  destination: t.destination,
  date: t.date,
  endDate: t.end_date,
  amount: t.amount,
  deadline: t.deadline,
  type: t.type,
  code: t.code,
  organizer: t.organizer,
  organizerName: t.organizer_name,
  participants: t.participants ?? undefined,
})

export const users = {
  async getByWallet(walletAddress) {
    const row = db.prepare('SELECT wallet_address as walletAddress, username, profile_image as profileImage, age FROM users WHERE wallet_address = ?').get(walletAddress)
    return row || null
  },
  async upsert({ walletAddress, username, profileImage, age }) {
    const upsert = db.prepare(`
      INSERT INTO users(wallet_address, username, profile_image, age)
      VALUES(?, ?, ?, ?)
      ON CONFLICT(wallet_address) DO UPDATE SET
        username=excluded.username,
        profile_image=excluded.profile_image,
        age=excluded.age
    `)
    upsert.run(walletAddress, username || null, profileImage || null, Number.isInteger(age) ? age : null)
    const row = db.prepare('SELECT wallet_address as walletAddress, username, profile_image as profileImage, age FROM users WHERE wallet_address = ?').get(walletAddress)
    return row
  },
}

export const trips = {
  async listPublic() {
    const rows = db.prepare(`
      SELECT t.*, (
        SELECT COUNT(1) FROM participants p WHERE p.trip_id = t.id
      ) as participants
      FROM trips t
      WHERE t.type = 'universal'
      ORDER BY datetime(t.created_at) DESC
    `).all()
    return rows.map(mapTrip)
  },
  async getById(id) {
    const trip = db.prepare(`
      SELECT t.*, (
        SELECT COUNT(1) FROM participants p WHERE p.trip_id = t.id
      ) as participants
      FROM trips t WHERE t.id = ?
    `).get(id)
    return trip ? mapTrip(trip) : null
  },
  async getByCode(code) {
    const trip = db.prepare(`
      SELECT t.*, (
        SELECT COUNT(1) FROM participants p WHERE p.trip_id = t.id
      ) as participants
      FROM trips t WHERE t.code = ?
    `).get(code)
    return trip ? mapTrip(trip) : null
  },
  async create(doc) {
    const tripId = doc.id || String(Date.now())
    try {
      db.prepare(`
        INSERT INTO trips(id, title, description, destination, date, end_date, amount, deadline, type, code, organizer, organizer_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tripId, doc.title, doc.description, doc.destination, doc.date, doc.endDate, Number(doc.amount), doc.deadline, doc.type, doc.code || null, doc.organizer, doc.organizerName || null)
    } catch (e) {
      if (String(e.message).includes('UNIQUE') && String(e.message).includes('code')) {
        const err = new Error('DUPLICATE_CODE')
        err.code = 'DUPLICATE_CODE'
        throw err
      }
      throw e
    }
    return {
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
      participants: 0,
    }
  },
  async checkin(id, walletAddress) {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id)
    if (!trip) return { notFound: true }
    try {
      db.prepare('INSERT INTO participants(trip_id, wallet_address) VALUES(?, ?)').run(id, walletAddress)
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) {
        return { already: true }
      }
      throw e
    }
    const count = db.prepare('SELECT COUNT(1) as c FROM participants WHERE trip_id = ?').get(id).c
    return { participants: count }
  },
  async listParticipants(id) {
    const rows = db.prepare('SELECT wallet_address FROM participants WHERE trip_id = ? ORDER BY joined_at ASC').all(id)
    return rows.map(r => ({ walletAddress: r.wallet_address }))
  },
}
