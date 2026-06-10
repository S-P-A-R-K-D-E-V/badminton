import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { NavMainProps } from './main/nav/types';

// ----------------------------------------------------------------------

export const navData: NavMainProps['data'] = [
  { title: 'Lịch chơi', path: paths.home, icon: <Iconify width={22} icon="solar:calendar-bold-duotone" /> },
  {
    title: 'Tra cứu đăng ký',
    path: paths.myRegistrations,
    icon: <Iconify width={22} icon="solar:clipboard-list-bold-duotone" />,
  },
];
