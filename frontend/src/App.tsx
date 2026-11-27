import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { getCurrentHHmm } from './services/timeService';
import { distractionShieldBridge } from './services/shieldBridge';
import { AppShell } from './components/AppShell';
import { ToastHost } from './components/ToastHost';
import { DevToolsPanel } from './components/DevToolsPanel';
import { AuthScreen } from './screens/auth/AuthScreen';
import { OnboardingFlow } from './screens/auth/OnboardingFlow';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { PlanScreen } from './screens/plan/PlanScreen';
import { NewDeliveryScreen } from './screens/plan/NewDeliveryScreen';
import { AiAnalyzingScreen } from './screens/plan/AiAnalyzingScreen';
import { AiReviewScreen } from './screens/plan/AiReviewScreen';
import { SubjectsScreen } from './screens/plan/SubjectsScreen';
import { RebalanceScreen } from './screens/plan/RebalanceScreen';
import { FocusScreen } from './screens/focus/FocusScreen';
import { FocusCompleteModal } from './screens/focus/FocusCompleteModal';
import { FocusShieldModal } from './screens/focus/FocusShieldModal';
import { LeisureConflictModal } from './screens/focus/LeisureConflictModal';
import { WellnessScreen } from './screens/wellness/WellnessScreen';
import { CurfewAlertModal } from './screens/wellness/CurfewAlertModal';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { ScheduleScreen } from './screens/profile/ScheduleScreen';
import { BadgesGuidesScreen } from './screens/profile/BadgesGuidesScreen';

export function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const user = useAppStore((s) => s.user);
  const config = useAppStore((s) => s.config);
  const activeTimer = useAppStore((s) => s.activeTimer);
  const activeTab = useAppStore((s) => s.activeTab);
  const planSubView = useAppStore((s) => s.planSubView);
  const profileSubView = useAppStore((s) => s.profileSubView);
  const curfewDismissedForToday = useAppStore((s) => s.curfewDismissedForToday);
  const hydrate = useAppStore((s) => s.hydrate);
  const setOnlineStatus = useAppStore((s) => s.setOnlineStatus);
  const setShowCurfewModal = useAppStore((s) => s.setShowCurfewModal);
  const triggerShieldWarning = useAppStore((s) => s.triggerShieldWarning);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onOnline = () => setOnlineStatus(true);
    const onOffline = () => setOnlineStatus(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnlineStatus]);

  // Global Distraction Shield monitoring (fires on return from background/tab switch)
  useEffect(() => {
    const isProtectedFocusRunning =
      Boolean(activeTimer?.startedAt) &&
      activeTimer?.mode === 'focus' &&
      Boolean(activeTimer?.shieldEnabled);
    if (!isProtectedFocusRunning) return;

    return distractionShieldBridge.startMonitoring((awaySeconds) => {
      void triggerShieldWarning(awaySeconds);
    });
  }, [activeTimer?.startedAt, activeTimer?.mode, activeTimer?.shieldEnabled, triggerShieldWarning]);

  // Automatic Nocturnal Curfew Check (every 20s)
  useEffect(() => {
    if (!user?.onboardingCompleted || !config || curfewDismissedForToday) return;
    const check = () => {
      if (getCurrentHHmm() >= config.curfewAlertTime) {
        setShowCurfewModal(true);
      }
    };
    const id = window.setInterval(check, 20000);
    return () => window.clearInterval(id);
  }, [user, config, curfewDismissedForToday, setShowCurfewModal]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF8FF] text-sm font-bold text-[#2563EB]">
        Cargando MicroPlan...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <ToastHost />
        <AuthScreen />
      </>
    );
  }

  if (!user.onboardingCompleted) {
    return (
      <>
        <ToastHost />
        <OnboardingFlow />
      </>
    );
  }

  const renderPlanView = () => {
    switch (planSubView) {
      case 'new_delivery':
        return <NewDeliveryScreen />;
      case 'analyzing_ai':
        return <AiAnalyzingScreen />;
      case 'review_ai':
        return <AiReviewScreen />;
      case 'subjects':
        return <SubjectsScreen />;
      case 'rebalance':
        return <RebalanceScreen />;
      default:
        return <PlanScreen />;
    }
  };

  const renderProfileView = () => {
    switch (profileSubView) {
      case 'schedule':
        return <ScheduleScreen />;
      case 'badges':
        return <BadgesGuidesScreen />;
      default:
        return <ProfileScreen />;
    }
  };

  return (
    <AppShell>
      <ToastHost />
      {activeTab === 'dashboard' ? <DashboardScreen /> : null}
      {activeTab === 'plan' ? renderPlanView() : null}
      {activeTab === 'focus' ? <FocusScreen /> : null}
      {activeTab === 'wellness' ? <WellnessScreen /> : null}
      {activeTab === 'profile' ? renderProfileView() : null}

      {/* Global Native Modals (<dialog>) */}
      <FocusShieldModal />
      <LeisureConflictModal />
      <FocusCompleteModal />
      <CurfewAlertModal />
      <DevToolsPanel />
    </AppShell>
  );
}

export default App;
