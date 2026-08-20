import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildQrUrl } from '@/lib/payment-qr'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// GET /api/agent/payment-requests/:id — trạng thái 1 yêu cầu thanh toán
// (PENDING/CONFIRMED/REJECTED), dùng để agent kiểm tra admin đã xác nhận
// qua Telegram hay chưa.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  const payReq = await prisma.paymentRequest.findUnique({ where: { id: params.id } })
  if (!payReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...payReq,
    qrUrl: payReq.code ? buildQrUrl(payReq.totalAmount, payReq.code) : null,
  })
}
