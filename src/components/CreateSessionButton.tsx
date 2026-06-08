'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SessionSchema, type SessionInput } from '@/lib/validations'

export default function CreateSessionButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SessionInput>({
    resolver: zodResolver(SessionSchema),
    defaultValues: { isRecurring: false },
  })

  async function onSubmit(data: SessionInput) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        courts: [
          { name: 'Sân A', maxSlots: 10, warnAt: 8 },
        ],
      }),
    })
    if (res.ok) {
      const session = await res.json()
      reset()
      setOpen(false)
      router.push(`/admin/sessions/${session.id}`)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
      >
        + Tạo buổi chơi
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Tạo buổi chơi mới</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tên buổi chơi</label>
                <input
                  {...register('title')}
                  placeholder="Cầu lông T4 tuần này"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ngày</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Địa điểm</label>
                  <input
                    {...register('location')}
                    placeholder="Sân Thăng Long"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurring" {...register('isRecurring')} className="rounded" />
                <label htmlFor="recurring" className="text-sm text-gray-700">Lịch cố định</label>
              </div>

              <p className="text-xs text-gray-400">* Mặc định tạo 1 sân. Có thể thêm sân sau khi tạo.</p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors mt-1"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo buổi chơi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
