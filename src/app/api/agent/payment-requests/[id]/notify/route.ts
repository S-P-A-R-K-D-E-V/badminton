import { NextResponse } from 'next/server'
import { sendPaymentTelegramNotification, PaymentRequestError } from '@/lib/payment-request'
import { isAgentAuthorized, agentUnauthorized } from '@/lib/agentAuth'

// POST /api/agent/payment-requests/:id/notify — gửi thông báo thanh toán vào
// nhóm Telegram (kèm nút xác nhận/hủy cho admin) cho 1 yêu cầu đã tạo qua
// POST /api/agent/payment-requests.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAgentAuthorized(req)) return agentUnauthorized()

  try {
    const { payReq, telegramSent } = await sendPaymentTelegramNotification(params.id)
    return NextResponse.json({ id: payReq.id, telegramSent })
  } catch (e) {
    if (e instanceof PaymentRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
