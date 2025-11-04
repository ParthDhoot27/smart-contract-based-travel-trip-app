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
        minFund,
        whatsappLink,
        discordLink,
        initialDepositOctas,
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

      // Validate initial deposit for universal trips (>= 2x per-member cost)
      if (type === 'universal') {
        const dep = BigInt(String(initialDepositOctas || '0'))
        const amountOctas = BigInt(Math.floor(Number(amount) * 1e8))
        if (dep < amountOctas * BigInt(2)) {
          return res.status(400).json({ error: 'Initial deposit must be at least 2x per-member cost (in APT)' })
        }
      }

      // Attempt create, retry on duplicate code if auto-generated
      let created
      let attempts = 0
      while (true) {
        try {
          created = await store.trips.create({
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
            minFund,
            whatsappLink,
            discordLink,
            initialDepositOctas: String(initialDepositOctas || '0'),
            escrowOctas: String(initialDepositOctas || '0'),
          })
          break
        } catch (e) {
          if (e && e.code === 'DUPLICATE_CODE' && type === 'private' && codeOption !== 'custom' && attempts < 3) {
            code = nano()
            attempts++
            continue
          }
          throw e
        }
      }
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
      const { walletAddress, name, age, txHash, amountOctas, status, network } = req.body
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })

      const result = await store.trips.checkin(id, walletAddress, name, Number.isInteger(age) ? age : null, amountOctas, status)
      if (result.notFound) return res.status(404).json({ error: 'Trip not found' })
      if (result.code === 'TRIP_NOT_OPEN') return res.status(409).json({ error: 'Trip is not open for check-in' })
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

  // Confirm a trip (organizer closes registrations)
  router.post('/:id/confirm', async (req, res, next) => {
    try {
      const { id } = req.params
      const { walletAddress } = req.body || {}
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })
      const out = await store.trips.confirm(id, walletAddress)
      if (out.notFound) return res.status(404).json({ error: 'Trip not found' })
      if (out.forbidden) return res.status(403).json({ error: 'Only organizer can confirm this trip' })
      return res.json(out)
    } catch (e) {
      next(e)
    }
  })

  // Cancel a trip (organizer cancels; refunds handled by smart contract in production)
  router.post('/:id/cancel', async (req, res, next) => {
    try {
      const { id } = req.params
      const { walletAddress } = req.body || {}
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' })
      const out = await store.trips.cancel(id, walletAddress)
      if (out.notFound) return res.status(404).json({ error: 'Trip not found' })
      if (out.forbidden) return res.status(403).json({ error: 'Only organizer can cancel this trip' })
      return res.json(out)
    } catch (e) {
      next(e)
    }
  })

  // Organizer remove a participant with a reason (not a live chat; message sent to participant inbox)
  router.post('/:id/remove-participant', async (req, res, next) => {
    try {
      const { id } = req.params
      const { organizer, participantWallet, reason } = req.body || {}
      if (!organizer || !participantWallet) return res.status(400).json({ error: 'organizer and participantWallet are required' })
      if (!store.trips || !store.trips.removeParticipant) return res.status(500).json({ error: 'Trips store not supported' })
      const out = await store.trips.removeParticipant(id, organizer, participantWallet, reason)
      if (out.notFound) return res.status(404).json({ error: 'Trip or participant not found' })
      if (out.forbidden) return res.status(403).json({ error: 'Only organizer can remove participants' })
      return res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  // Total escrow across all trips
  router.get('/funds/total', async (_req, res, next) => {
    try {
      if (!store.transactions || !store.transactions.totalEscrow) return res.json({ octas: '0' })
      const total = await store.transactions.totalEscrow()
      return res.json(total)
    } catch (e) {
      next(e)
    }
  })

  // Escrow for a specific trip
  router.get('/:id/funds', async (req, res, next) => {
    try {
      const { id } = req.params
      const t = await store.trips.getById(id)
      if (!t) return res.status(404).json({ error: 'Trip not found' })
      return res.json({ octas: t.escrowOctas || '0' })
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
