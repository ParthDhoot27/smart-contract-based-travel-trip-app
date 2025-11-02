export async function seedDemo(store) {
  try {
    const demoWallet = '0xDEMO000000000000000000000000000000000001'
    const demoName = 'Demo User'
    const demoAge = 20

    // Ensure demo user exists and locked
    await store.users.register({ walletAddress: demoWallet, fullName: demoName, age: demoAge })

    // Create demo universal trip for $2 if not exists
    const demoTripId = 'demo-trip-2-usd'
    const existing = await store.trips.getById(demoTripId)
    if (!existing) {
      await store.trips.create({
        id: demoTripId,
        title: 'Demo Universal Trip',
        description: 'A sample demo trip priced at $2.',
        destination: 'Demo City',
        date: '2026-01-01',
        endDate: '2026-01-02',
        amount: 2,
        deadline: '2025-12-31',
        type: 'universal',
        code: null,
        organizer: demoWallet,
        organizerName: demoName,
      })
      // Add 7 participants
      const participants = [
        '0xDEMO000000000000000000000000000000000101',
        '0xDEMO000000000000000000000000000000000102',
        '0xDEMO000000000000000000000000000000000103',
        '0xDEMO000000000000000000000000000000000104',
        '0xDEMO000000000000000000000000000000000105',
        '0xDEMO000000000000000000000000000000000106',
        '0xDEMO000000000000000000000000000000000107',
      ]
      for (const w of participants) {
        await store.trips.checkin(demoTripId, w)
      }
    }
  } catch (e) {
    // Non-fatal seeding errors
    console.warn('Seed demo failed:', e?.message || e)
  }
}
