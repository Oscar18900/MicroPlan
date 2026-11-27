import { Capacitor, registerPlugin } from '@capacitor/core';

interface MicroPlanGoogleAuthPlugin {
  signIn(options: { serverClientId: string }): Promise<{
    idToken: string;
    email?: string;
    displayName?: string;
  }>;
}

const MicroPlanGoogleAuth = registerPlugin<MicroPlanGoogleAuthPlugin>(
  'MicroPlanGoogleAuth'
);

export function isNativeAndroidGoogleAuthAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function signInWithNativeGoogle(serverClientId: string) {
  return MicroPlanGoogleAuth.signIn({ serverClientId });
}
