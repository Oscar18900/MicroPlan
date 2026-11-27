/**
 * Pluggable Distraction Shield Bridge.
 * - Phase 2 (Web/PWA): monitors document.visibilitychange & route exits; triggers conscious friction modal upon return.
 * - Phase 4 (Capacitor Android APK): swaps in native AppState + UsageStatsManager / Overlay / Do Not Disturb integration.
 */
export interface DistractionShieldBridge {
  readonly platform: 'web_pwa' | 'capacitor_android';
  startMonitoring: (onExternalExitReturn: (awaySeconds: number) => void) => () => void;
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

export const distractionShieldBridge: DistractionShieldBridge = new WebPwaShieldBridge();
