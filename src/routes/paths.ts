// ----------------------------------------------------------------------

export const paths = {
  home: '/',
  session: (id: string) => `/session/${id}`,
  myRegistrations: '/my-registrations',
  cancel: (token: string) => `/cancel/${token}`,
  admin: {
    root: '/admin',
    login: '/admin/login',
    sessions: '/admin/sessions',
    session: (id: string) => `/admin/sessions/${id}`,
    calendar: '/admin/calendar',
  },
};
