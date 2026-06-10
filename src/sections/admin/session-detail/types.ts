// ----------------------------------------------------------------------

export type AdminRegistration = {
  id: string;
  playerName: string;
  playerGender: string;
  playerRank: string;
  registrantName: string;
  registrantPhone: string;
  isProxy: boolean;
  status: string;
  isPaid: boolean;
  registeredAt: string;
};

export type AdminCourt = {
  id: string;
  name: string;
  maxSlots: number;
  warnAt: number;
  registrations: AdminRegistration[];
  _count: { registrations: number };
};

export type AdminSessionCost = {
  courtFee: number;
  shuttlecockCost: number;
  supplyCost: number;
  otherCost: number;
  note?: string | null;
} | null;

export type AdminSession = {
  id: string;
  status: string;
  courts: AdminCourt[];
  cost: AdminSessionCost;
};

export const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

export function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
