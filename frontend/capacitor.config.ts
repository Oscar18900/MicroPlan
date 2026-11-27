import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.buap.microplan',
  appName: 'MicroPlan',
  webDir: 'dist',
  server: {
    url: 'https://micro-plan.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FAF8FF',
  },
};

export default config;
