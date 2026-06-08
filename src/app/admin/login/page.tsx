'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...pin]
    next[i] = value
    setPin(next)
    if (value && i < 5) inputs.current[i + 1]?.focus()
    if (next.every((d) => d !== '')) submitPin(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function submitPin(code: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: code }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('PIN không đúng')
      setPin(['', '', '', '', '', ''])
      setLoading(false)
      inputs.current[0]?.focus()
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl border shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Admin</h1>
        <p className="text-gray-500 text-sm mb-6">Nhập PIN 6 số</p>

        <div className="flex gap-2 justify-center mb-4">
          {pin.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {loading && <p className="text-gray-400 text-sm mt-2">Đang xác thực...</p>}
      </div>
    </div>
  )
}
