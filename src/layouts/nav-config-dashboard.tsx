import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  external: icon('ic-external'),
  booking: icon('ic-booking'),
  calendar: icon('ic-calendar'),
  analytics: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Quản lý',
    items: [
      { title: 'Tổng quan', path: paths.admin.root, icon: ICONS.analytics },
      { title: 'Buổi chơi', path: paths.admin.sessions, icon: ICONS.booking },
      { title: 'Lịch', path: paths.admin.calendar, icon: ICONS.calendar },
    ],
  },
  {
    subheader: 'Liên kết',
    items: [{ title: 'Trang chủ', path: paths.home, icon: ICONS.external }],
  },
];
