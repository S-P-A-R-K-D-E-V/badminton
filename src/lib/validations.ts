import { z } from 'zod'
import { RANK_OPTIONS } from './utils'

export const PlayerSchema = z.object({
  playerName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(50),
  playerGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  playerRank: z.enum(RANK_OPTIONS as [string, ...string[]]),
})

export const RegisterSchema = z.object({
  registrantName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(50),
  registrantPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{9}$/, 'SĐT không hợp lệ'),
  courtId: z.string().cuid(),
  players: z.array(PlayerSchema).min(1, 'Ít nhất 1 người').max(4, 'Tối đa 4 người'),
})

export const SessionSchema = z.object({
  title: z.string().min(3).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(3).max(200),
  isRecurring: z.boolean().default(false),
})

export const CourtSchema = z.object({
  name: z.string().min(1).max(20),
  maxSlots: z.number().int().min(2).max(20).default(10),
  warnAt: z.number().int().min(1).max(19).default(8),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type SessionInput = z.infer<typeof SessionSchema>
export type CourtInput = z.infer<typeof CourtSchema>
