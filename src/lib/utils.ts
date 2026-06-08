import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isBefore, subHours } from 'date-fns'
import { vi } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: vi })
}

export function formatTime(time: Date | string) {
  return format(new Date(time), 'HH:mm')
}

// Rank system: NB, Y, TBY, TB, TBK, K với modifiers +, -, ++, --
const RANK_ORDER: Record<string, number> = {
  NB: 0, Y: 10, TBY: 20, TB: 30, TBK: 40, K: 50,
}
const MOD_ORDER: Record<string, number> = {
  '--': -2, '-': -1, '': 0, '+': 1, '++': 2,
}

export function parseRank(rank: string): { base: string; mod: string } {
  const match = rank.match(/^(NB|TBK|TBY|TB|Y|K)(\+\+|\+|--|-)?)$/)
  if (!match) return { base: 'TB', mod: '' }
  return { base: match[1], mod: match[2] ?? '' }
}

export function rankScore(rank: string): number {
  const { base, mod } = parseRank(rank)
  return (RANK_ORDER[base] ?? 0) + (MOD_ORDER[mod] ?? 0)
}

export const RANK_OPTIONS = [
  'NB', 'Y--', 'Y-', 'Y', 'Y+', 'Y++',
  'TBY--', 'TBY-', 'TBY', 'TBY+', 'TBY++',
  'TB--', 'TB-', 'TB', 'TB+', 'TB++',
  'TBK--', 'TBK-', 'TBK', 'TBK+', 'TBK++',
  'K--', 'K-', 'K', 'K+', 'K++',
]

export const CANCEL_DEADLINE_HOURS = 2

export function canCancelRegistration(sessionDate: Date, sessionStartTime: Date): boolean {
  const sessionStart = new Date(sessionDate)
  sessionStart.setHours(sessionStartTime.getHours(), sessionStartTime.getMinutes())
  return isBefore(new Date(), subHours(sessionStart, CANCEL_DEADLINE_HOURS))
}
