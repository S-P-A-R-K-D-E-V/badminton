import { NextResponse } from 'next/server'
import { sendReminders } from '@/lib/bot'

// GET /api/cron/remind — called by k8s CronJob every 15 min
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await sendReminders()
  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}
