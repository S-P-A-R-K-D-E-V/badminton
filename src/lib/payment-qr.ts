const BANK_ID = 'MB'
const ACCOUNT_NO = '2510199966668'
const ACCOUNT_NAME = 'VŨ XUÂN BÌNH'
const BANK_LABEL = 'MB Bank'

export { ACCOUNT_NO, ACCOUNT_NAME, BANK_LABEL }

// Excludes visually ambiguous characters (0/O, 1/I) so the code is easy to
// read off a bank statement or type by hand.
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePaymentCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)]
  }
  return `BAD-${code}`
}

export function buildQrUrl(totalAmount: number, content: string): string {
  return (
    `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${totalAmount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
  )
}
