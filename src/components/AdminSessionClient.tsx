'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Registration = {
  id: string
  playerName: string
  playerGender: string
  playerRank: string
  registrantName: string
  registrantPhone: string
  isProxy: boolean
  registeredAt: string
}

type Court = {
  id: string
  name: string
  maxSlots: number
  warnAt: number
  registrations: Registration[]
  _count: { registrations: number }
}

type Session = {
  id: string
  status: string
  courts: Court[]
}

export default function AdminSessionClient({ session }: { session: Session }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function changeStatus(status: string) {
    setLoading(true)
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setLoading(false)
  }

  async function addCourt() {
    const name = prompt('Tên sân mới (VD: Sân B)')
    if (!name) return
    await fetch(`/api/admin/sessions/${session.id}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, maxSlots: 10, warnAt: 8 }),
    })
    router.refresh()
  }

  async function cancelRegistration(regId: string, playerName: string) {
    if (!confirm(`Hủy đăng ký của ${playerName}?`)) return
    await fetch(`/api/admin/registrations/${regId}/cancel`, { method: 'POST' })
    router.refresh()
  }

  async function deleteCourt(courtId: string, courtName: string) {
    if (!confirm(`Xóa ${courtName}? Tất cả đăng ký sẽ bị xóa theo.`)) return
    await fetch(`/api/admin/courts/${courtId}`, { method: 'DELETE' })
    router.refresh()
  }

  const GENDER_LABEL: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }

  return (
    <div className="flex flex-col gap-4">
      {/* Status controls */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
        {['OPEN', 'CLOSED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            disabled={loading || session.status === s}
            onClick={() => changeStatus(s)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              session.status === s
                ? s === 'OPEN' ? 'bg-green-600 text-white' : s === 'CLOSED' ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
                : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'OPEN' ? 'Đang mở' : s === 'CLOSED' ? 'Đóng' : 'Hủy buổi'}
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          <a
            href={`/session/${session.id}`}
            target="_blank"
            className="px-3 py-1 text-xs border rounded-full hover:bg-gray-50 text-gray-600"
          >
            Xem trang member
          </a>
          <button
            onClick={addCourt}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            + Thêm sân
          </button>
        </div>
      </div>

      {/* Courts */}
      {session.courts.map((court) => {
        const booked = court._count.registrations
        const full = booked >= court.maxSlots
        const warn = booked >= court.warnAt
        return (
          <div key={court.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${
              full ? 'bg-red-50 border-b border-red-100' : warn ? 'bg-yellow-50 border-b border-yellow-100' : 'border-b'
            }`}>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{court.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  full ? 'bg-red-100 text-red-700' : warn ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {booked}/{court.maxSlots} người {full ? '🔴 Đầy' : warn ? '🟡 Sắp đầy' : '🟢'}
                </span>
              </div>
              <button
                onClick={() => deleteCourt(court.id, court.name)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Xóa sân
              </button>
            </div>

            {court.registrations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Chưa có đăng ký</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Tên</th>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Giới tính</th>
                    <th className="px-4 py-2 text-left">Đăng ký bởi</th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {court.registrations.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.playerName}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded font-mono">
                          {r.playerRank}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{GENDER_LABEL[r.playerGender]}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">
                        {r.isProxy ? `${r.registrantName} (${r.registrantPhone})` : r.registrantPhone}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => cancelRegistration(r.id, r.playerName)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Hủy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
