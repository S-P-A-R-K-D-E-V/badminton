// ----------------------------------------------------------------------

export type HomeCourtItem = {
  id: string;
  name: string;
  maxSlots: number;
  warnAt: number;
  _count: { registrations: number };
};

export type HomeSessionItem = {
  id: string;
  title: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  location: string;
  status: string;
  courts: HomeCourtItem[];
};
