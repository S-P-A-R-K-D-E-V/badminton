import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth'
import { getBot } from '@/lib/bot'

// GET /api/telegram/setup — admin only
// Re-registers the webhook with correct allowed_updates including callback_query.
// Call once after deploying inline keyboard changes.
export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = getBot()
  if (!bot) return NextResponse.json({ error: 'Bot not configured (missing TELEGRAM_BOT_TOKEN)' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return NextResponse.json({ error: 'Missing NEXT_PUBLIC_APP_URL env var' }, { status: 500 })

  const webhookUrl = `${appUrl}/api/telegram/webhook`

  const setWebhookOpts: Record<string, unknown> = {
    allowed_updates: ['message', 'callback_query'],
  }
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    setWebhookOpts.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET
  }

  await bot.api.setWebhook(webhookUrl, setWebhookOpts as Parameters<typeof bot.api.setWebhook>[1])

  const info = await bot.api.getWebhookInfo()

  return NextResponse.json({
    ok: true,
    webhookUrl,
    info,
  })
}
