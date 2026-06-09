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
  status: string
  isPaid: boolean
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

type SessionCost = {
  courtFee: number
  shuttlecockCost: number
  supplyCost: number
  otherCost: number
  note?: string | null
} | null

type Session = {
  id: string
  status: string
  courts: Court[]
  cost: SessionCost
}

const GENDER_LABEL: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nu', OTHER: 'Khac' }

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function AdminSessionClient({ session }: { session: Session }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [showCostPanel, setShowCostPanel] = useState(false)
  const [cost, setCost] = useState<SessionCost>(session.cost)
  const [costForm, setCostForm] = useState({
    courtFee:        session.cost?.courtFee        ?? 0,
    shuttlecockCost: session.cost?.shuttlecockCost ?? 0,
    supplyCost:      session.cost?.supplyCost      ?? 0,
    otherCost:       session.cost?.otherCost       ?? 0,
    note:            session.cost?.note            ?? '',
  })
  const [savingCost, setSavingCost] = useState(false)

  const totalCost = costForm.courtFee + costForm.shuttlecockCost + costForm.supplyCost + costForm.otherCost
  const totalConfirmed = session.courts.reduce(
    (sum, c) => sum + c.registrations.filter((r) => r.status === 'CONFIRMED').length,
    0
  )
  const perPerson = totalConfirmed > 0 ? Math.ceil(totalCost / totalConfirmed) : 0

  const existingTotal = cost
    ? cost.courtFee + cost.shuttlecockCost + cost.supplyCost + cost.otherCost
    : 0
  const existingPerPerson = cost && totalConfirmed > 0
    ? Math.ceil(existingTotal / totalConfirmed)
    : 0

  async function saveCost() {
    setSavingCost(true)
    const res = await fetch(`/api/admin/sessions/${session.id}/cost`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(costForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setCost(updated)
      setShowCostPanel(false)
    }
    setSavingCost(false)
  }

  async function togglePayment(regId: string) {
    await fetch(`/api/admin/registrations/${regId}/payment`, { method: 'POST' })
    router.refresh()
  }

  async function duplicateSession() {
    if (!confirm('Nhan doi buoi choi nay sang tuan sau (+7 ngay)?')) return
    setDuplicating(true)
    const res = await fetch(`/api/admin/sessions/${session.id}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const newSession = await res.json()
      router.push(`/admin/sessions/${newSession.id}`)
    } else {
      alert('Loi khi nhan doi buoi choi')
    }
    setDuplicating(false)
  }

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
    const name = prompt('Ten san moi (VD: San B)')
    if (!name) return
    await fetch(`/api/admin/sessions/${session.id}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, maxSlots: 10, warnAt: 8 }),
    })
    router.refresh()
  }

  async function cancelRegistration(regId: string, playerName: string) {
    if (!confirm(`Huy dang ky cua ${playerName}?`)) return
    await fetch(`/api/admin/registrations/${regId}/cancel`, { method: 'POST' })
    router.refresh()
  }

  async function deleteCourt(courtId: string, courtName: string) {
    if (!confirm(`Xoa ${courtName}? Tat ca dang ky se bi xoa theo.`)) return
    await fetch(`/api/admin/courts/${courtId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status controls */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Trang thai:</span>
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
            {s === 'OPEN' ? 'Dang mo' : s === 'CLOSED' ? 'Dong' : 'Huy buoi'}
          </button>
        ))}
        <div className="ml-auto flex gap-2 flex-wrap">
          <a href={`/session/${session.id}`} target="_blank"
            className="px-3 py-1 text-xs border rounded-full hover:bg-gray-50 text-gray-600">
            Xem member
          </a>
          <button onClick={duplicateSession} disabled={duplicating}
            className="px-3 py-1 text-xs border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 disabled:opacity-50">
            {duplicating ? 'Dang...' : 'Nhan doi'}
          </button>
          <button onClick={() => setShowCostPanel(!showCostPanel)}
            className="px-3 py-1 text-xs border border-orange-200 text-orange-700 rounded-full hover:bg-orange-50">
            Chi phi
          </button>
          <button onClick={addCourt}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700">
            + San
          </button>
        </div>
      </div>

      {/* Cost summary bar */}
      {cost && !showCostPanel && existingTotal > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-orange-700">Tong chi phi: <strong>{formatVND(existingTotal)}</strong></span>
          {existingPerPerson > 0 && (
            <span className="text-orange-600">Moi nguoi: <strong>{formatVND(existingPerPerson)}</strong></span>
          )}
        </div>
      )}

      {/* Cost panel */}
      {showCostPanel && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quan ly chi phi</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {([
              { label: 'Tien san', key: 'courtFee' },
              { label: 'Tien cau', key: 'shuttlecockCost' },
              { label: 'Nuoc / phu phi', key: 'supplyCost' },
              { label: 'Chi phi khac', key: 'otherCost' },
            ] as const).map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                <input
                  type="number" min={0}
                  value={costForm[key]}
                  onChange={(e) => setCostForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Ghi chu</label>
            <input type="text" value={costForm.note}
              onChange={(e) => setCostForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="VD: San Le Van Sy 4 tieng"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {totalCost > 0 && (
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-900 mb-3">
              <div className="flex justify-between">
                <span>Tong:</span>
                <strong>{formatVND(totalCost)}</strong>
              </div>
              {perPerson > 0 && (
                <div className="flex justify-between mt-1">
                  <span>Moi nguoi ({totalConfirmed}):</span>
                  <strong>{formatVND(perPerson)}</strong>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCostPanel(false)}
              className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
              Huy
            </button>
            <button onClick={saveCost} disabled={savingCost}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {savingCost ? 'Dang luu...' : 'Luu chi phi'}
            </button>
          </div>
        </div>
      )}

      {/* Courts */}
      {session.courts.map((court) => {
        const booked = court._count.registrations
        const full = booked >= court.maxSlots
        const warn = booked >= court.warnAt
        const confirmed = court.registrations.filter((r) => r.status === 'CONFIRMED')
        const waitlist = court.registrations.filter((r) => r.status === 'WAITLIST')

        return (
          <div key={court.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${full ? 'bg-red-50 border-b border-red-100' : warn ? 'bg-yellow-50 border-b border-yellow-100' : 'border-b'}`}>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{court.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${full ? 'bg-red-100 text-red-700' : warn ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {booked}/{court.maxSlots} {full ? 'Day' : warn ? 'Sap day' : 'Con cho'}
                </span>
              </div>
              <button onClick={() => deleteCourt(court.id, court.name)}
                className="text-xs text-red-400 hover:text-red-600">
                Xoa san
              </button>
            </div>

            {court.registrations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Chua co dang ky</p>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Ten</th>
                      <th className="px-4 py-2 text-left">Rank</th>
                      <th className="px-4 py-2 text-left">GT</th>
                      <th className="px-4 py-2 text-left">Dang ky boi</th>
                      <th className="px-4 py-2 text-center">Da tra</th>
                      <th className="px-4 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {confirmed.map((r, i) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.playerName}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded font-mono">{r.playerRank}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{GENDER_LABEL[r.playerGender]}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {r.isProxy ? `${r.registrantName} (${r.registrantPhone})` : r.registrantPhone}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => togglePayment(r.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${r.isPaid ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
                            {r.isPaid && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => cancelRegistration(r.id, r.playerName)}
                            className="text-xs text-red-400 hover:text-red-600">
                            Huy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {waitlist.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 text-xs font-medium text-yellow-700">
                      Hang cho ({waitlist.length})
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-yellow-50">
                        {waitlist.map((r, i) => (
                          <tr key={r.id} className="bg-yellow-50/40 hover:bg-yellow-50">
                            <td className="px-4 py-2.5 text-yellow-600 w-8">{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-700">{r.playerName}</td>
                            <td className="px-4 py-2.5">
                              <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded font-mono">{r.playerRank}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">{GENDER_LABEL[r.playerGender]}</td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">
                              {r.isProxy ? `${r.registrantName} (${r.registrantPhone})` : r.registrantPhone}
                            </td>
                            <td className="px-4 py-2.5"></td>
                            <td className="px-4 py-2.5 text-right">
                              <button onClick={() => cancelRegistration(r.id, r.playerName)}
                                className="text-xs text-red-400 hover:text-red-600">
                                Xoa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
