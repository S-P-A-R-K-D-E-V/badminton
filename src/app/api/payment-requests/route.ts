import { NextResponse } from 'next/server'
import { createPaymentRequest, PaymentRequestError } from '@/lib/payment-request'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const registrationIds = body?.registrationIds

  try {
    const payReq = await createPaymentRequest(registrationIds)
    return NextResponse.json({ id: payReq.id, code: payReq.code, totalAmount: payReq.totalAmount })
  } catch (e) {
    if (e instanceof PaymentRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
