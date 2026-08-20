import { NextResponse } from 'next/server'
import { buildQrUrl } from '@/lib/payment-qr'
import { createPaymentRequest, PaymentRequestError } from '@/lib/payment-request'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// POST /api/agent/payment-requests — tạo yêu cầu thanh toán + mã QR VietQR
// cho 1 nhóm đăng ký (thường cùng 1 buổi). Trả về ngay ảnh QR sẵn dùng.
export async function POST(req: Request) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const body = await req.json().catch(() => null)
  const registrationIds = body?.registrationIds

  try {
    const payReq = await createPaymentRequest(registrationIds)
    return NextResponse.json(
      {
        id: payReq.id,
        code: payReq.code,
        totalAmount: payReq.totalAmount,
        qrUrl: buildQrUrl(payReq.totalAmount, payReq.code!),
        registrationIds: payReq.registrationIds,
        name: payReq.name,
        phone: payReq.phone,
        status: payReq.status,
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof PaymentRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
