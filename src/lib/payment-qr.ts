const BANK_ID = 'MB'
const ACCOUNT_NO = '2510199966668'
const ACCOUNT_NAME = 'VŨ XUÂN BÌNH'
const BANK_LABEL = 'MB Bank'

export { ACCOUNT_NO, ACCOUNT_NAME, BANK_LABEL }

export function buildAddInfo(name: string, players: string[], sessionDate: string): string {
  const d = new Date(sessionDate)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  const who = players.length > 0 ? ` (${players.join(', ')})` : ''
  return `Cầu lông - ${name}${who} ${day}${month}${year}`
}

export function buildQrUrl(
  totalAmount: number,
  name: string,
  players: string[],
  sessionDate: string
): string {
  const addInfo = encodeURIComponent(buildAddInfo(name, players, sessionDate))
  return (
    `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${totalAmount}&addInfo=${addInfo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
  )
}
