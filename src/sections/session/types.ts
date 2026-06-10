// ----------------------------------------------------------------------

export type CourtData = {
  id: string;
  name: string;
  maxSlots: number;
  warnAt: number;
  registrations: {
    id: string;
    playerName: string;
    playerGender: string;
    playerRank: string;
    isProxy: boolean;
    registrantName: string;
  }[];
  _count: { registrations: number };
  waitlistCount?: number;
};

export type SessionData = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  courts: CourtData[];
};

export type RegistrationResult = {
  cancelToken: string;
  playerName: string;
  status: string;
};
