import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)
const COOKIE = 'admin_token'

export async function signIn(pin: string): Promise<boolean> {
  const admins = await prisma.admin.findMany()
  for (const admin of admins) {
    const ok = await bcrypt.compare(pin, admin.pinHash)
    if (ok) {
      const token = await new SignJWT({ id: admin.id, role: admin.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('12h')
        .sign(SECRET)

      cookies().set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 12,
        path: '/',
      })
      return true
    }
  }
  return false
}

export async function getAdmin() {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { id: string; role: string }
  } catch {
    return null
  }
}

export function signOut() {
  cookies().delete(COOKIE)
}
