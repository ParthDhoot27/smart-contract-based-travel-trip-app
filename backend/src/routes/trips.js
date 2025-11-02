import express from 'express'
import { customAlphabet } from 'nanoid'

const nano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export default function createTripsRouter(store) {
  const router = express.Router()

  router.get('/', async (req, res, next) => {
    try {
      const rows = await store.trips.listPublic()
      res.json(rows)
    } catch (e) {
      next(e)
    }
  })

  // List trips created by organizer
  router.get('/organizer/:walletAddress', async (req, res, next) => {
    try {
      const { walletAddress } = req.params
      const rows = await store.trips.listByOrganizer(walletAddress)
      return res.json(rows)
    } catch (e) {
      next(e)
    }
  })

  // List trips joined by participant
  router.get('/participant/:walletAddress', async (req, res, next) => {
    try {
      const { walletAddress } = req.params
      const rows = await store.trips.listByParticipant(walletAddress)
      return res.json(rows)
    } catch (e) {
      next(e)
    }
  })

  router.get('/:id/participants', async (req, res, next) => {
    try {
      const { id } = req.params
      const trip = await store.trips.getById(id)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      const participants = await store.trips.listParticipants(id)
      return res.json(participants)
    } catch (e) {
      next(e)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params
      const trip = await store.trips.getById(id)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      res.json(trip)
    } catch (e) {
      next(e)
    }
  })

  router.get('/code/:code', async (req, res, next) => {
    try {
      const { code } = req.params
      const trip = await store.trips.getByCode(code)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      res.json(trip)
    } catch (e) {
      next(e)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const {
        title,
        description,
        destination,
        date,
        endDate,
        amount,
        deadline,
        type,
        codeOption,
        customCode,
        organizer,
        organizerName,
        id,
      } = req.body

      if (!title || !description || !destination || !date || !endDate || !amount || !deadline || !type || !organizer) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      let code = null
      if (type === 'private') {
        if (codeOption === 'custom') {
          if (!customCode) return res.status(400).json({ error: 'customCode required for custom option' })
          code = String(customCode).toUpperCase()
        } else {
          code = nano()
        }
      }

      const created = await store.trips.create({
        id,
        title,
        description,
        destination,
        date,
        endDate,
        amount,
        deadline,
        type,
        code,
        organizer,
        organizerName,
      })
      res.status(201).json(created)
    } catch (e) {
      if (e && (e.code === 'DUPLICATE_CODE')) {
        return res.status(409).json({ error: 'Trip code already exists' })
      }
      next(e)
    }
  })

  router.post('/:id/checkin', async (req, res, next) => {
    try {
      const { id } = req.params
      const { walletAddress, txHash, amountOctas, status, network } = req.body
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })

      const result = await store.trips.checkin(id, walletAddress)
      if (result.notFound) return res.status(404).json({ error: 'Trip not found' })
      if (result.already) return res.status(409).json({ error: 'Already checked in' })
      // Optional: log transaction if provided
      if (store.transactions && (txHash || status)) {
        try {
          await store.transactions.log({ tripId: id, from: walletAddress, to: undefined, amountOctas: amountOctas || '0', status: status || 'success', hash: txHash || null, network: network || 'unknown' })
        } catch (e) {
          // non-fatal
          console.warn('tx log failed', e?.message || e)
        }
      }
      return res.json({ success: true, participants: result.participants })
    } catch (e) {
      next(e)
    }
  })

  // Delete a trip (requires organizer match in body)
  router.delete('/:id', async (req, res, next) => {
    try {
      const { id } = req.params
      const { walletAddress } = req.body || {}
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })
      const trip = await store.trips.getById(id)
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
      if (trip.organizer !== walletAddress) return res.status(403).json({ error: 'Only organizer can delete this trip' })
      const out = await store.trips.delete(id)
      return res.json(out)
    } catch (e) {
      next(e)
    }
  })

  return router
}
