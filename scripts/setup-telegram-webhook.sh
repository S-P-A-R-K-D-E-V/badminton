#!/bin/sh
# Usage: BOT_TOKEN=xxx APP_URL=https://yourdomain.com WEBHOOK_SECRET=yyy ./scripts/setup-telegram-webhook.sh

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-$BOT_TOKEN}"
APP_URL="${NEXT_PUBLIC_APP_URL:-$APP_URL}"
SECRET="${TELEGRAM_WEBHOOK_SECRET:-$WEBHOOK_SECRET}"

if [ -z "$BOT_TOKEN" ] || [ -z "$APP_URL" ]; then
  echo "Usage: TELEGRAM_BOT_TOKEN=xxx NEXT_PUBLIC_APP_URL=https://domain.com ./scripts/setup-telegram-webhook.sh"
  exit 1
fi

WEBHOOK_URL="${APP_URL}/api/telegram/webhook"

echo "Setting webhook: $WEBHOOK_URL"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${SECRET}\",
    \"allowed_updates\": [\"message\"],
    \"drop_pending_updates\": true
  }" | python3 -m json.tool

echo ""
echo "Verifying webhook info:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
