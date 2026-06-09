'use client'

import { useState } from 'react'
import { formatDate, formatTime, canCancelRegistration } from '@/lib/utils'
import Link from 'next/link'

type RegResult = {
  id: string
  playerName: string
  isProxy: boolean
  cancelToken: string
  registeredAt: string
  courtName: string
  session: {
    title: string
    date: string
    startTime: string
    location: string
    status: string
  }
}

export default function MyRegistrationsPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState<RegResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch(
        `/api/my-registrations?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`
      )
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Có lỗi xảy ra')
      else setResults(data)
    } catch {
      setError('Lỗi kết nối, thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Tra cứu đăng ký</h1>
        <p className="text-sm text-gray-500">Nhập đúng tên và số điện thoại để xem danh sách đăng ký</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tên người đăng ký</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Đang tìm...' : 'Tra cứu'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
      )}

      {results !== null && (
        results.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Không tìm thấy đăng ký nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">{results.length} đăng ký</p>
            {results.map((r) => {
              const canCancel = canCancelRegistration(new Date(r.session.date), new Date(r.session.startTime))
              const sessionClosed = r.session.status !== 'OPEN'
              return (
                <div key={r.id} className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.playerName}</p>
                      {r.isProxy && (
                        <p className="text-xs text-gray-400">Đăng ký hộ</p>
                      )}
                    </div>
                    {canCancel && !sessionClosed ? (
                      <Link
                        href={`/cancel/${r.cancelToken}`}
                        className="text-xs text-red-500 hover:underline shrink-0"
                      >
                        Hủy đăng ký
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300 shrink-0">
                        {sessionClosed ? 'Đã đóng' : 'Hết hạn hủy'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 flex flex-col gap-0.5">
                    <p>📋 {r.session.title}</p>
                    <p>📅 {formatDate(r.session.date)} · {formatTime(r.session.startTime)}</p>
                    <p>🏸 Sân {r.courtName} · 📍 {r.session.location}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
