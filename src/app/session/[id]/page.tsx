'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema, type RegisterInput } from '@/lib/validations'
import { RANK_OPTIONS, formatDate, formatTime } from '@/lib/utils'

type CourtData = {
  id: string
  name: string
  maxSlots: number
  warnAt: number
  registrations: {
    id: string
    playerName: string
    playerGender: string
    playerRank: string
    isProxy: boolean
    registrantName: string
  }[]
  _count: { registrations: number }
}

type SessionData = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  status: string
  courts: CourtData[]
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ cancelToken: string; playerName: string }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { register, control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      registrantName: '',
      registrantPhone: '',
      courtId: '',
      players: [{ playerName: '', playerGender: 'MALE', playerRank: 'TB' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'players' })

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => { setSession(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function onSubmit(data: RegisterInput) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Đăng ký thất bại')
      } else {
        setSuccess(json.registrations.map((r: { playerName: string; cancelToken: string }) => ({
          playerName: r.playerName,
          cancelToken: r.cancelToken,
        })))
      }
    } catch {
      setError('Lỗi kết nối, thử lại sau')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>
  if (!session) return <div className="text-center py-16 text-gray-400">Không tìm thấy buổi chơi</div>

  if (success) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
        <p className="text-gray-500 text-sm mb-6">Lưu link hủy phòng khi cần (trước 2h)</p>
        <div className="flex flex-col gap-3 text-left mb-6">
          {success.map((r) => (
            <div key={r.cancelToken} className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">{r.playerName}</p>
              <a
                href={`/cancel/${r.cancelToken}`}
                className="text-xs text-red-500 hover:underline break-all"
              >
                🔗 Link hủy đăng ký
              </a>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Session info */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{session.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span>📅 {formatDate(session.date)}</span>
          <span>🕐 {formatTime(session.startTime)} – {formatTime(session.endTime)}</span>
          <span>📍 {session.location}</span>
        </div>
      </div>

      {/* Courts */}
      <div className="flex flex-col gap-3">
        {session.courts.map((court) => {
          const booked = court._count.registrations
          const full = booked >= court.maxSlots
          const warn = booked >= court.warnAt
          return (
            <div key={court.id} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{court.name}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  full ? 'bg-red-100 text-red-700' : warn ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {booked}/{court.maxSlots} {full ? '· Đầy' : warn ? '· Sắp đầy' : '· Còn chỗ'}
                </span>
              </div>
              {/* Slot grid */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {Array.from({ length: court.maxSlots }).map((_, i) => {
                  const reg = court.registrations[i]
                  return (
                    <div
                      key={i}
                      title={reg ? `${reg.playerName} (${reg.playerRank})` : 'Trống'}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                        reg
                          ? reg.playerGender === 'FEMALE'
                            ? 'bg-pink-100 text-pink-700 border border-pink-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-300 border border-gray-200'
                      }`}
                    >
                      {reg ? reg.playerRank : i + 1}
                    </div>
                  )
                })}
              </div>
              {court.registrations.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {court.registrations.map((r, i) => (
                    <li key={r.id}>
                      {i + 1}. {r.playerName} <span className="text-gray-400">({r.playerRank})</span>
                      {r.isProxy && <span className="text-gray-400"> · đăng ký bởi {r.registrantName}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Registration form */}
      {session.status === 'OPEN' && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900 text-lg">Đăng ký tham gia</h2>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Tên người đăng ký</label>
              <input
                {...register('registrantName')}
                placeholder="Nguyễn Văn A"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.registrantName && <p className="text-red-500 text-xs mt-1">{errors.registrantName.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Số điện thoại</label>
              <input
                {...register('registrantPhone')}
                placeholder="0901234567"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.registrantPhone && <p className="text-red-500 text-xs mt-1">{errors.registrantPhone.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Chọn sân</label>
            <select
              {...register('courtId')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn sân --</option>
              {session.courts.map((c) => {
                const avail = c.maxSlots - c._count.registrations
                return (
                  <option key={c.id} value={c.id} disabled={avail <= 0}>
                    {c.name} — còn {avail} chỗ {avail <= 0 ? '(Đầy)' : ''}
                  </option>
                )
              })}
            </select>
            {errors.courtId && <p className="text-red-500 text-xs mt-1">{errors.courtId.message}</p>}
          </div>

          {/* Players */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Người chơi</label>
              {fields.length < 4 && (
                <button
                  type="button"
                  onClick={() => append({ playerName: '', playerGender: 'MALE', playerRank: 'TB' })}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  + Thêm người
                </button>
              )}
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Người {idx + 1}</span>
                  {idx > 0 && (
                    <button type="button" onClick={() => remove(idx)} className="text-xs text-red-500 hover:text-red-700">
                      Xóa
                    </button>
                  )}
                </div>
                <input
                  {...register(`players.${idx}.playerName`)}
                  placeholder="Họ tên"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
                {errors.players?.[idx]?.playerName && (
                  <p className="text-red-500 text-xs">{errors.players[idx]?.playerName?.message}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    {...register(`players.${idx}.playerGender`)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  <select
                    {...register(`players.${idx}.playerRank`)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {RANK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {errors.players && typeof errors.players.message === 'string' && (
              <p className="text-red-500 text-xs">{errors.players.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
          </button>
        </form>
      )}

      {session.status === 'CLOSED' && (
        <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
          Buổi chơi này đã đóng đăng ký
        </div>
      )}
    </div>
  )
}
