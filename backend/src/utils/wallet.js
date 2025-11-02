export function deriveProfileFromWallet(walletAddress) {
  if (!walletAddress) return null
  const clean = String(walletAddress).toLowerCase()
  const uname = `user-${clean.replace(/^0x/, '').slice(0, 6)}`
  let hash = 0
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0
  const age = 18 + (hash % 41)
  return { walletAddress, username: uname, age }
}
