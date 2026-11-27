import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';

export interface NativeShieldPermissions {
  usageAccess: boolean;
  overlay: boolean;
  notifications: boolean;
}

interface MicroPlanShieldPlugin {
  getPermissionStatus(): Promise<NativeShieldPermissions>;
  requestUsageAccess(): Promise<void>;
  requestOverlayPermission(): Promise<void>;
  requestNotificationPermission(): Promise<void>;
  startShield(options: {
    endsAtMs: number;
    taskTitle?: string;
  }): Promise<{ active: boolean; missingPermissions?: boolean }>;
  stopShield(): Promise<void>;
}

const MicroPlanShield = registerPlugin<MicroPlanShieldPlugin>('MicroPlanShield');

/**
 * Pluggable Distraction Shield Bridge.
 * - Web/PWA: monitors document.visibilitychange & route exits; triggers conscious friction modal upon return.
 * - Capacitor Android APK: combines AppState with native UsageStatsManager + Overlay ForegroundService.
 */
export interface DistractionShieldBridge {
  readonly platform: 'web_pwa' | 'capacitor_android';
  startMonitoring: (
    onExternalExitReturn: (awaySeconds: number) => void,
    meta?: { endsAtMs?: number; taskTitle?: string | null }
  ) => () => void;
  getNativePermissions?: () => Promise<NativeShieldPermissions>;
  requestUsageAccess?: () => Promise<void>;
  requestOverlayPermission?: () => Promise<void>;
  requestNotificationPermission?: () => Promise<void>;
}

class WebPwaShieldBridge implements DistractionShieldBridge {
  readonly platform = 'web_pwa' as const;

  startMonitoring(onExternalExitReturn: (awaySeconds: number) => void): () => void {
    let leftAtMs: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        leftAtMs = Date.now();
      } else if (document.visibilityState === 'visible' && leftAtMs !== null) {
        const awaySeconds = Math.max(1, Math.round((Date.now() - leftAtMs) / 1000));
        leftAtMs = null;
        onExternalExitReturn(awaySeconds);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
}

class CapacitorAndroidShieldBridge implements DistractionShieldBridge {
  readonly platform = 'capacitor_android' as const;

  startMonitoring(
    onExternalExitReturn: (awaySeconds: number) => void,
    meta?: { endsAtMs?: number; taskTitle?: string | null }
  ): () => void {
    let leftAtMs: number | null = null;
    let disposed = false;
    let handle: PluginListenerHandle | null = null;

    void MicroPlanShield.startShield({
      endsAtMs: meta?.endsAtMs ?? 0,
      taskTitle: meta?.taskTitle ?? '',
    }).catch(() => {});

    void App.addListener('appStateChange', ({ isActive }) => {
      if (disposed) return;
      if (!isActive) {
        leftAtMs = Date.now();
      } else if (leftAtMs !== null) {
        const awaySeconds = Math.max(1, Math.round((Date.now() - leftAtMs) / 1000));
        leftAtMs = null;
        onExternalExitReturn(awaySeconds);
      }
    })
      .then((listener) => {
        if (disposed) {
          void listener.remove();
        } else {
          handle = listener;
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      void MicroPlanShield.stopShield().catch(() => {});
      if (handle) {
        void handle.remove();
        handle = null;
      }
    };
  }

  async getNativePermissions(): Promise<NativeShieldPermissions> {
    return MicroPlanShield.getPermissionStatus();
  }

  async requestUsageAccess(): Promise<void> {
    await MicroPlanShield.requestUsageAccess();
  }

  async requestOverlayPermission(): Promise<void> {
    await MicroPlanShield.requestOverlayPermission();
  }

  async requestNotificationPermission(): Promise<void> {
    await MicroPlanShield.requestNotificationPermission();
  }
}

const isCapacitorAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const distractionShieldBridge: DistractionShieldBridge = isCapacitorAndroid
  ? new CapacitorAndroidShieldBridge()
  : new WebPwaShieldBridge();
