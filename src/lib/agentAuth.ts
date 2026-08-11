import { NextResponse } from 'next/server'

// Xác thực agent (AI/automation) qua API key tĩnh, dùng cho các thao tác
// máy-với-máy không tiện đăng nhập cookie như admin thường.
export function isAgentAuthorized(req: Request): boolean {
  const key = req.headers.get('x-agent-key')
  const expected = process.env.AGENT_API_KEY
  return !!expected && key === expected
}

export function agentUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
