import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  assetsDir: string;
  isStaticExport: boolean;
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'SPARK Badminton',
  appVersion: packageJson.version,
  assetsDir: process.env.NEXT_PUBLIC_ASSETS_DIR ?? '',
  isStaticExport: false,
};
