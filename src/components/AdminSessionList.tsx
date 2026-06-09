'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

type Session = {
  id: string
  title: string
  date: string
  startTime: string
  location: string
  status: string
  courts: {
    id: string
    maxSlots: number
    _count: { registrations: number }
  }[]
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function AdminSessionList({ sessions }: { sessions: Session[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectMode, setSelectMode] = useState(false)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === sessions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sessions.map((s) => s.id)))
    }
  }

  async function bulkUpdate(status: 'CLOSED' | 'CANCELLED') {
    if (selected.size === 0) return
    const label = status === 'CLOSED' ? 'đóng' : 'hủy'
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${selected.size} buổi chơi?`)) return

    setBulkLoading(true)
    await fetch('/api/admin/sessions/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    })
    setSelected(new Set())
    setSelectMode(false)
    router.refresh()
    setBulkLoading(false)
  }

  if (sessions.length === 0) {
    return <div className="text-center py-12 text-gray-400">Chưa có buổi chơi nào</div>
  }

  return (
    <div>
      {/* Bulk toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => {
            setSelectMode(!selectMode)
            setSelected(new Set())
          }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            selectMode
              ? 'bg-gray-800 text-white border-gray-800'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {selectMode ? 'Thoát chọn' : 'Chọn nhiều'}
        </button>

        {selectMode && (
          <>
            <button
              onClick={toggleAll}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {selected.size === sessions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            {selected.size > 0 && (
              <>
                <button
                  onClick={() => bulkUpdate('CLOSED')}
                  disabled={bulkLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Đóng ({selected.size})
                </button>
                <button
                  onClick={() => bulkUpdate('CANCELLED')}
                  disabled={bulkLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Hủy ({selected.size})
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {sessions.map((s) => {
          const totalBooked = s.courts.reduce((sum, c) => sum + c._count.registrations, 0)
          const totalSlots = s.courts.reduce((sum, c) => sum + c.maxSlots, 0)
          const isSelected = selected.has(s.id)

          return (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm transition-colors ${
                isSelected ? 'border-blue-400 ring-1 ring-blue-300' : ''
              }`}
            >
              {selectMode ? (
                <button
                  onClick={() => toggleSelect(s.id)}
                  className="w-full p-4 text-left flex items-start gap-3"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h2 className="font-semibold text-gray-900">{s.title}</h2>
                        <p className="text-sm text-gray-500">{formatDate(s.date)} · {formatTime(s.startTime)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>📍 {s.location}</span>
                      <span>👥 {totalBooked}/{totalSlots}</span>
                      <span>{s.courts.length} sân</span>
                    </div>
                  </div>
                </button>
              ) : (
                <Link href={`/admin/sessions/${s.id}`} className="p-4 block">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="font-semibold text-gray-900">{s.title}</h2>
                      <p className="text-sm text-gray-500">{formatDate(s.date)} · {formatTime(s.startTime)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>📍 {s.location}</span>
                    <span>👥 {totalBooked}/{totalSlots}</span>
                    <span>{s.courts.length} sân</span>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
