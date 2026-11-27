import { type ReactNode } from 'react';
import {
  CalendarCheck2,
  FlaskConical,
  HeartPulse,
  Home,
  Timer,
  UserCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { canAccessLab, useAppStore } from '../store/useAppStore';
import type { AppTab } from '../types/domain';

const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: typeof Home }> = [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'plan', label: 'Plan', icon: CalendarCheck2 },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'wellness', label: 'Wellness', icon: HeartPulse },
  { id: 'profile', label: 'Perfil', icon: UserCircle2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isOnline = useAppStore((s) => s.isOnline);
  const backendConnected = useAppStore((s) => s.backendConnected);
  const pendingSyncCount = useAppStore((s) => s.pendingSyncCount);
  const setShowDevTools = useAppStore((s) => s.setShowDevTools);
  const activeTimer = useAppStore((s) => s.activeTimer);
  const isFocusActive = Boolean(activeTimer?.startedAt && activeTimer.mode === 'focus');
  const showLabButton = canAccessLab(user);

  return (
    <div className="min-h-dvh w-full bg-[#EAEDFF]/60 flex justify-center">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FAF8FF] shadow-[0_0_40px_rgba(19,27,46,0.08)]">
        {/* Compact PWA status & Lab bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E7F3]/80 bg-[#FAF8FF]/92 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isOnline
                  ? 'bg-[#E2F7F5] text-[#006A63]'
                  : 'bg-[#FFFBEB] text-[#B15106]'
              }`}
            >
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {!isOnline
                ? 'Sin conexión'
                : backendConnected
                  ? 'Cloud Sync'
                  : 'PWA Local'}
            </span>
            {pendingSyncCount > 0 ? (
              <span className="rounded-full bg-[#F2F3FF] px-2 py-0.5 text-[10px] font-medium text-[#434655]">
                {pendingSyncCount} en cola
              </span>
            ) : null}
            {isFocusActive ? (
              <span className="rounded-full bg-[#E5EEFF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                Focus activo
              </span>
            ) : null}
          </div>
          {showLabButton ? (
            <button
              type="button"
              onClick={() => setShowDevTools(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[#E5E7F3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#434655] hover:bg-[#F2F3FF]"
              aria-label="Abrir modo pruebas"
            >
              <FlaskConical className="h-3 w-3 text-[#2563EB]" />
              Lab
            </button>
          ) : null}
        </header>

        {/* Main scrollable viewport */}
        <main className="flex-1 safe-bottom-pad">{children}</main>

        {/* Bottom 5-tab navigation matching Figma BottomNav */}
        <nav
          aria-label="Navegación principal"
          className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-[#E5E7F3] bg-white/96 px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] backdrop-blur-md"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-w-[58px] flex-col items-center gap-1 rounded-2xl px-2.5 py-1 transition-colors ${
                  active ? 'text-[#2563EB]' : 'text-[#737686] hover:text-[#131B2E]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-[#E5EEFF]' : 'bg-transparent'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
