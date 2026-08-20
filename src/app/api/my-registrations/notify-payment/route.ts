import { NextResponse } from 'next/server'
import { sendPaymentTelegramNotification, PaymentRequestError } from '@/lib/payment-request'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { paymentRequestId } = body ?? {}

  if (!paymentRequestId) {
    return NextResponse.json({ error: 'Thiếu mã yêu cầu thanh toán' }, { status: 400 })
  }

  try {
    const { payReq } = await sendPaymentTelegramNotification(paymentRequestId)
    return NextResponse.json({ id: payReq.id })
  } catch (e) {
    if (e instanceof PaymentRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
