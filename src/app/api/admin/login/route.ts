import { NextResponse } from 'next/server'
import { signIn, signOut } from '@/lib/auth'

export async function POST(req: Request) {
  const { pin } = await req.json()
  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN không hợp lệ' }, { status: 400 })
  }

  const ok = await signIn(pin)
  if (!ok) return NextResponse.json({ error: 'PIN sai' }, { status: 401 })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  signOut()
  return NextResponse.json({ ok: true })
}
