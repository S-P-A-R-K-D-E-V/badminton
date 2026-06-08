'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

type CancelInfo = {
  playerName: string
  courtName: string
  sessionTitle: string
  sessionDate: string
  canCancel: boolean
}

export default function CancelPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [info, setInfo] = useState<CancelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setInfo(data)
        setLoading(false)
      })
      .catch(() => { setError('Lỗi kết nối'); setLoading(false) })
  }, [token])

  async function handleCancel() {
    setSubmitting(true)
    const res = await fetch(`/api/cancel/${token}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.ok) setCancelled(true)
    else setError(json.error)
    setSubmitting(false)
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>

  if (cancelled) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đã hủy đăng ký</h2>
        <p className="text-gray-500 text-sm mb-6">Chỗ của bạn đã được giải phóng</p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
        >
          Về trang chủ
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-gray-700 mb-6">{error}</p>
        <button onClick={() => router.push('/')} className="text-sm text-green-600 hover:underline">
          Về trang chủ
        </button>
      </div>
    )
  }

  if (!info) return null

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Hủy đăng ký</h1>

      <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-1 text-sm">
        <p><span className="text-gray-500">Người chơi:</span> <strong>{info.playerName}</strong></p>
        <p><span className="text-gray-500">Buổi chơi:</span> {info.sessionTitle}</p>
        <p><span className="text-gray-500">Ngày:</span> {formatDate(info.sessionDate)}</p>
        <p><span className="text-gray-500">Sân:</span> {info.courtName}</p>
      </div>

      {!info.canCancel ? (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
          ⚠️ Đã quá hạn hủy (chỉ được hủy trước 2 tiếng)
        </div>
      ) : (
        <button
          onClick={handleCancel}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Đang hủy...' : 'Xác nhận hủy đăng ký'}
        </button>
      )}

      <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-600 text-center">
        Quay lại
      </button>
    </div>
  )
}
