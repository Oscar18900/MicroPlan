import { create } from 'zustand';
import { db, enqueueOfflineMutation, getSetting, setSetting } from '../db/database';
import { loadBuapDemoDataset } from '../db/seed';
import {
  computeLevelFromXp,
  computeSafeEmergencyCap,
  evaluateBadgesProgress,
  evaluateDailyStreakProgress,
  XP_REWARDS,
} from '../services/gamification';
import {
  addDaysYYYYMMDD,
  getClockOverride,
  getCurrentHHmm,
  getTodayKey,
  getWeekStartMonday,
  setClockOverride,
  type ClockOverride,
} from '../services/timeService';
import { audioEngine } from '../services/audioEngine';
import { sendLocalNotification } from '../services/notifications';
import type {
  ActiveFocusTimerState,
  AiBreakdownResponse,
  AmbientSoundType,
  AppTab,
  AttachmentMeta,
  BadgeCode,
  BadgeUnlock,
  ClassBlock,
  Delivery,
  FocusSession,
  MicroTask,
  RebalanceMove,
  SleepLog,
  Subject,
  ToastMessage,
  User,
  UserWellnessConfig,
} from '../types/domain';

export type PlanSubView =
  | 'list'
  | 'new_delivery'
  | 'analyzing_ai'
  | 'review_ai'
  | 'subjects'
  | 'rebalance';

export type ProfileSubView = 'main' | 'schedule' | 'badges';

export interface PendingAiDraft {
  subjectId: string;
  subjectName: string;
  title: string;
  dueDate: string;
  instructionsText: string;
  attachmentMeta?: AttachmentMeta;
  proposal: AiBreakdownResponse;
}

interface AppState {
  hydrated: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  user: User | null;
  config: UserWellnessConfig | null;
  subjects: Subject[];
  classBlocks: ClassBlock[];
  deliveries: Delivery[];
  microTasks: MicroTask[];
  focusSessions: FocusSession[];
  sleepLogs: SleepLog[];
  badgeUnlocks: BadgeUnlock[];
  activeTimer: ActiveFocusTimerState | null;

  // UI navigation & modal states
  activeTab: AppTab;
  planSubView: PlanSubView;
  profileSubView: ProfileSubView;
  pendingAiDraft: PendingAiDraft | null;
  showShieldModal: boolean;
  pendingNavigationTab: AppTab | null;
  showCompleteModal: boolean;
  lastCompletedXp: number;
  lastCompletedTaskId: string | null;
  showCurfewModal: boolean;
  curfewDismissedForToday: boolean;
  showDevTools: boolean;
  clockOverride: ClockOverride;
  toasts: ToastMessage[];

  // Actions
  hydrate: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  pushToast: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  setActiveTab: (tab: AppTab, bypassShield?: boolean) => void;
  setPlanSubView: (view: PlanSubView) => void;
  setProfileSubView: (view: ProfileSubView) => void;
  setPendingAiDraft: (draft: PendingAiDraft | null) => void;
  setShowDevTools: (open: boolean) => void;
  setShowCurfewModal: (open: boolean) => void;
  setShowCompleteModal: (open: boolean) => void;
  setShowShieldModal: (open: boolean) => void;

  // Auth
  registerLocal: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginLocal: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogleLocal: (name?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;

  // Onboarding
  updateOnboardingProfile: (data: {
    career: string;
    semester: string;
    sleepGoalHours: 7.0 | 7.5 | 8.0;
    curfewAlertTime: string;
    bedtimeLimitTime: string;
  }) => Promise<void>;
  saveOnboardingSubjects: (
    subjectsInput: Array<{ name: string; colorHex: string; shift: 'morning' | 'afternoon' | 'mixed' }>
  ) => Promise<void>;
  saveOnboardingLeisure: (data: {
    leisureStart: string;
    leisureEnd: string;
    leisureDays: number[];
    leisureTags: string[];
  }) => Promise<void>;
  completeOnboarding: (withDemoTask?: boolean) => Promise<void>;

  // Subjects & Schedule
  addSubject: (name: string, colorHex: string) => Promise<Subject | null>;
  deleteSubject: (subjectId: string) => Promise<void>;
  addClassBlock: (block: Omit<ClassBlock, 'id' | 'userId'>) => Promise<void>;
  deleteClassBlock: (blockId: string) => Promise<void>;

  // Deliveries & MicroTasks
  confirmAiDelivery: (draft: PendingAiDraft) => Promise<void>;
  createManualDelivery: (input: {
    subjectId: string;
    title: string;
    dueDate: string;
    instructionsText: string;
    initialTaskTitle?: string;
  }) => Promise<void>;
  addManualMicroTask: (deliveryId: string, title: string, minutes: 25 | 50, scheduledDate: string) => Promise<void>;
  toggleMicroTaskComplete: (microTaskId: string, via?: 'direct' | 'focus') => Promise<void>;
  deleteDelivery: (deliveryId: string) => Promise<void>;
  applyRebalanceMoves: (moves: RebalanceMove[]) => Promise<void>;

  // Focus & Shield
  openFocusWithTask: (microTaskId: string | null, plannedMinutes?: number) => Promise<void>;
  setFocusDuration: (minutes: number) => Promise<void>;
  setFocusShield: (enabled: boolean) => Promise<void>;
  setFocusSound: (sound: AmbientSoundType) => Promise<void>;
  unlinkFocusMicroTask: () => Promise<void>;
  startOrResumeFocus: () => Promise<void>;
  pauseFocus: () => Promise<void>;
  resetFocus: () => Promise<void>;
  completeFocusBlock: (completedEarly?: boolean) => Promise<void>;
  discardFocusBlock: () => Promise<void>;
  pauseFocusAndGoHome: () => Promise<void>;
  triggerShieldWarning: () => Promise<void>;
  startRegenerativeBreak: () => Promise<void>;
  extendFocusPlus25: () => Promise<void>;

  // Wellness & Profile
  recordSleepCheckin: (sleptHours: number) => Promise<void>;
  rescheduleTodayAndSleep: () => Promise<void>;
  activateEmergencyMode: () => Promise<{ ok: boolean; error?: string }>;
  updateWellnessConfig: (partial: Partial<UserWellnessConfig>) => Promise<void>;

  // DevTools / Time Sim
  updateClockSim: (partial: Partial<ClockOverride>) => Promise<void>;
  loadDemoDataset: () => Promise<void>;
  resetAllLocalData: () => Promise<void>;
  simulateSyncFlush: () => Promise<void>;
}

function defaultWellnessConfig(userId: string): UserWellnessConfig {
  return {
    userId,
    sleepGoalHours: 7.5,
    curfewAlertTime: '22:30',
    bedtimeLimitTime: '23:00',
    shieldRigidity: 'balanced',
    emergencyMinutes: 45,
    emergencyWeeklyQuota: 2,
    emergencyUsedThisWeek: 0,
    emergencyWeekStart: getWeekStartMonday(getTodayKey()),
    dailyCapacityMinutes: 180,
    leisureDays: [1, 2, 3, 4, 5],
    leisureStart: '17:00',
    leisureEnd: '18:00',
    leisureTags: ['Paseo', 'Gym', 'Videojuegos'],
  };
}

function defaultTimer(userId: string): ActiveFocusTimerState {
  return {
    id: 'current',
    userId,
    mode: 'focus',
    plannedMinutes: 25,
    durationSec: 25 * 60,
    startedAt: null,
    pausedRemainingSec: 25 * 60,
    microTaskId: null,
    microTaskTitle: null,
    shieldEnabled: true,
    ambientSound: 'silence',
    interruptionsCount: 0,
  };
}

async function reloadUserStateFromDb(userId: string) {
  const [
    user,
    configRaw,
    subjects,
    classBlocks,
    deliveries,
    microTasks,
    focusSessions,
    sleepLogs,
    badgeUnlocks,
    activeTimerRaw,
    pendingSyncCount,
  ] = await Promise.all([
    db.users.get(userId),
    db.wellnessConfigs.get(userId),
    db.subjects.where('userId').equals(userId).toArray(),
    db.classBlocks.where('userId').equals(userId).toArray(),
    db.deliveries.where('userId').equals(userId).toArray(),
    db.microTasks.where('userId').equals(userId).toArray(),
    db.focusSessions.where('userId').equals(userId).toArray(),
    db.sleepLogs.where('userId').equals(userId).toArray(),
    db.badgeUnlocks.where('userId').equals(userId).toArray(),
    db.activeTimer.get('current'),
    db.syncQueue.where('synced').equals(0).count(),
  ]);

  let config = configRaw ?? null;
  if (user && !config) {
    config = defaultWellnessConfig(userId);
    await db.wellnessConfigs.put(config);
  }

  // Weekly reset for emergency quota if week changed
  if (config) {
    const currentWeekStart = getWeekStartMonday(getTodayKey());
    if (config.emergencyWeekStart !== currentWeekStart) {
      config = {
        ...config,
        emergencyWeekStart: currentWeekStart,
        emergencyUsedThisWeek: 0,
      };
      await db.wellnessConfigs.put(config);
    }
  }

  let activeTimer = activeTimerRaw && activeTimerRaw.userId === userId ? activeTimerRaw : null;
  if (user && !activeTimer) {
    activeTimer = defaultTimer(userId);
    await db.activeTimer.put(activeTimer);
  }

  return {
    user: user ?? null,
    config,
    subjects,
    classBlocks,
    deliveries,
    microTasks,
    focusSessions,
    sleepLogs,
    badgeUnlocks,
    activeTimer,
    pendingSyncCount,
  };
}

async function awardXpAndEvaluateBadges(
  userId: string,
  xpDelta: number,
  streakUpdate?: { nextStreak: number; bestStreak: number; lastStreakDate: string }
): Promise<{ newlyUnlocked: BadgeCode[]; updatedUser: User | null }> {
  const user = await db.users.get(userId);
  if (!user) return { newlyUnlocked: [], updatedUser: null };

  const newXp = Math.max(0, user.xp + xpDelta);
  const { level } = computeLevelFromXp(newXp);
  const patch: Partial<User> = { xp: newXp, level };
  if (streakUpdate) {
    patch.currentStreak = streakUpdate.nextStreak;
    patch.bestStreak = streakUpdate.bestStreak;
    patch.lastStreakDate = streakUpdate.lastStreakDate;
  }
  await db.users.update(userId, patch);

  const [updatedUser, sleepLogs, focusSessions, deliveries, badgeUnlocks] = await Promise.all([
    db.users.get(userId),
    db.sleepLogs.where('userId').equals(userId).toArray(),
    db.focusSessions.where('userId').equals(userId).toArray(),
    db.deliveries.where('userId').equals(userId).toArray(),
    db.badgeUnlocks.where('userId').equals(userId).toArray(),
  ]);

  const newlyUnlocked: BadgeCode[] = [];
  if (updatedUser) {
    const progress = evaluateBadgesProgress({
      user: updatedUser,
      sleepLogs,
      focusSessions,
      deliveries,
      unlockedBadges: badgeUnlocks,
    });
    const existingSet = new Set(badgeUnlocks.map((b) => b.badgeCode));
    for (const item of progress) {
      if (item.unlocked && !existingSet.has(item.def.code)) {
        newlyUnlocked.push(item.def.code);
        await db.badgeUnlocks.put({
          id: `bg_${userId}_${item.def.code}`,
          userId,
          badgeCode: item.def.code,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  }

  return { newlyUnlocked, updatedUser: updatedUser ?? null };
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  user: null,
  config: null,
  subjects: [],
  classBlocks: [],
  deliveries: [],
  microTasks: [],
  focusSessions: [],
  sleepLogs: [],
  badgeUnlocks: [],
  activeTimer: null,

  activeTab: 'dashboard',
  planSubView: 'list',
  profileSubView: 'main',
  pendingAiDraft: null,
  showShieldModal: false,
  pendingNavigationTab: null,
  showCompleteModal: false,
  lastCompletedXp: 0,
  lastCompletedTaskId: null,
  showCurfewModal: false,
  curfewDismissedForToday: false,
  showDevTools: false,
  clockOverride: getClockOverride(),
  toasts: [],

  hydrate: async () => {
    const activeUserId = await getSetting('currentUserId');
    if (!activeUserId) {
      set({ hydrated: true, user: null });
      return;
    }
    const data = await reloadUserStateFromDb(activeUserId);
    set({ hydrated: true, ...data });
  },

  setOnlineStatus: (online) => {
    const sim = get().clockOverride.simulateOffline;
    set({ isOnline: sim ? false : online });
  },

  pushToast: (text, tone = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 4200);
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setActiveTab: (tab, bypassShield = false) => {
    const { activeTab, activeTimer } = get();
    const isTimerRunning =
      activeTimer &&
      activeTimer.mode === 'focus' &&
      activeTimer.startedAt !== null &&
      activeTimer.shieldEnabled;

    if (!bypassShield && activeTab === 'focus' && tab !== 'focus' && isTimerRunning) {
      set({ pendingNavigationTab: tab, showShieldModal: true });
      return;
    }

    set({
      activeTab: tab,
      planSubView: tab === 'plan' ? get().planSubView : 'list',
      profileSubView: tab === 'profile' ? get().profileSubView : 'main',
    });
  },

  setPlanSubView: (view) => set({ planSubView: view }),
  setProfileSubView: (view) => set({ profileSubView: view }),
  setPendingAiDraft: (draft) => set({ pendingAiDraft: draft }),
  setShowDevTools: (open) => set({ showDevTools: open }),
  setShowCurfewModal: (open) =>
    set({ showCurfewModal: open, curfewDismissedForToday: open ? false : true }),
  setShowCompleteModal: (open) => set({ showCompleteModal: open }),
  setShowShieldModal: (open) => set({ showShieldModal: open }),

  registerLocal: async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.users.where('email').equals(cleanEmail).first();
    if (existing) {
      return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
    }
    const userId = `usr_${Date.now().toString(36)}`;
    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: btoa(unescape(encodeURIComponent(password))),
      authProvider: 'local',
      career: '',
      semester: '4°–6°',
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      lastStreakDate: null,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const config = defaultWellnessConfig(userId);
    const timer = defaultTimer(userId);

    await db.users.put(newUser);
    await db.wellnessConfigs.put(config);
    await db.activeTimer.put(timer);
    await enqueueOfflineMutation(userId, 'user', 'create', { email: cleanEmail });
    await setSetting('currentUserId', userId);

    const data = await reloadUserStateFromDb(userId);
    set({ ...data, activeTab: 'dashboard' });
    return { ok: true };
  },

  loginLocal: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.users.where('email').equals(cleanEmail).first();
    if (!user) {
      return { ok: false, error: 'No encontramos una cuenta local con ese correo. Regístrate primero.' };
    }
    const encoded = btoa(unescape(encodeURIComponent(password)));
    if (user.passwordHash && user.passwordHash !== encoded) {
      return { ok: false, error: 'Contraseña incorrecta.' };
    }
    await setSetting('currentUserId', user.id);
    const data = await reloadUserStateFromDb(user.id);
    set({ ...data, activeTab: 'dashboard' });
    return { ok: true };
  },

  loginWithGoogleLocal: async (name = 'Estudiante BUAP', email = 'estudiante@correo.buap.mx') => {
    const cleanEmail = email.trim().toLowerCase();
    let user = await db.users.where('email').equals(cleanEmail).first();
    if (!user) {
      const userId = `usr_g_${Date.now().toString(36)}`;
      user = {
        id: userId,
        name,
        email: cleanEmail,
        authProvider: 'google',
        career: '',
        semester: '4°–6°',
        xp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        lastStreakDate: null,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      };
      await db.users.put(user);
      await db.wellnessConfigs.put(defaultWellnessConfig(userId));
      await db.activeTimer.put(defaultTimer(userId));
    }
    await setSetting('currentUserId', user.id);
    const data = await reloadUserStateFromDb(user.id);
    set({ ...data, activeTab: 'dashboard' });
  },

  logout: async () => {
    audioEngine.stop();
    await setSetting('currentUserId', null);
    set({
      user: null,
      config: null,
      subjects: [],
      classBlocks: [],
      deliveries: [],
      microTasks: [],
      focusSessions: [],
      sleepLogs: [],
      badgeUnlocks: [],
      activeTimer: null,
      activeTab: 'dashboard',
    });
  },

  updateOnboardingProfile: async (data) => {
    const { user, config } = get();
    if (!user || !config) return;
    await db.users.update(user.id, { career: data.career, semester: data.semester });
    await db.wellnessConfigs.update(user.id, {
      sleepGoalHours: data.sleepGoalHours,
      curfewAlertTime: data.curfewAlertTime,
      bedtimeLimitTime: data.bedtimeLimitTime,
    });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  saveOnboardingSubjects: async (subjectsInput) => {
    const { user } = get();
    if (!user) return;
    const existing = await db.subjects.where('userId').equals(user.id).toArray();
    if (existing.length === 0 && subjectsInput.length > 0) {
      const createdSubjects: Subject[] = [];
      const createdBlocks: ClassBlock[] = [];
      subjectsInput.forEach((s, idx) => {
        const subId = `sub_${user.id}_${Date.now().toString(36)}_${idx}`;
        createdSubjects.push({ id: subId, userId: user.id, name: s.name, colorHex: s.colorHex });
        const baseHour = s.shift === 'afternoon' ? 14 + (idx % 3) * 2 : 8 + (idx % 3) * 2;
        const startTime = `${String(baseHour).padStart(2, '0')}:00`;
        const endTime = `${String(baseHour + 2).padStart(2, '0')}:00`;
        const day1 = ((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5;
        const day2 = (((idx + 2) % 5) + 1) as 1 | 2 | 3 | 4 | 5;
        createdBlocks.push(
          { id: `cb_${subId}_a`, userId: user.id, subjectId: subId, dayOfWeek: day1, startTime, endTime, label: s.name },
          { id: `cb_${subId}_b`, userId: user.id, subjectId: subId, dayOfWeek: day2, startTime, endTime, label: s.name }
        );
      });
      await db.subjects.bulkPut(createdSubjects);
      await db.classBlocks.bulkPut(createdBlocks);
    }
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  saveOnboardingLeisure: async (data) => {
    const { user } = get();
    if (!user) return;
    await db.wellnessConfigs.update(user.id, {
      leisureStart: data.leisureStart,
      leisureEnd: data.leisureEnd,
      leisureDays: data.leisureDays,
      leisureTags: data.leisureTags,
    });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  completeOnboarding: async (withDemoTask = false) => {
    const { user, subjects } = get();
    if (!user) return;
    if (withDemoTask) {
      let subjectId = subjects[0]?.id;
      if (!subjectId) {
        subjectId = `sub_${user.id}_demo`;
        await db.subjects.put({
          id: subjectId,
          userId: user.id,
          name: 'Seminario de Investigación',
          colorHex: '#2563EB',
        });
      }
      const today = getTodayKey();
      const due = addDaysYYYYMMDD(today, 3);
      const delId = `del_onb_${Date.now().toString(36)}`;
      await db.deliveries.put({
        id: delId,
        userId: user.id,
        subjectId,
        title: 'Ensayo de Metodologías (Ejemplo)',
        inferredType: 'essay',
        dueDate: due,
        instructionsText: 'Entrega de ejemplo creada en onboarding para explorar tu plan.',
        createdVia: 'ai',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      await db.microTasks.bulkPut([
        {
          id: `mt_${delId}_1`,
          deliveryId: delId,
          userId: user.id,
          title: 'Investigar 3 fuentes primarias y esquema',
          scheduledDate: today,
          scheduledSlot: '16:00',
          estimatedMinutes: 25,
          blocksCount: 1,
          status: 'pending',
          completedVia: null,
          completedAt: null,
        },
        {
          id: `mt_${delId}_2`,
          deliveryId: delId,
          userId: user.id,
          title: 'Redactar borrador del marco teórico',
          scheduledDate: addDaysYYYYMMDD(today, 1),
          scheduledSlot: '16:00',
          estimatedMinutes: 50,
          blocksCount: 2,
          status: 'pending',
          completedVia: null,
          completedAt: null,
        },
        {
          id: `mt_${delId}_3`,
          deliveryId: delId,
          userId: user.id,
          title: 'Revisar citas APA y formato final',
          scheduledDate: addDaysYYYYMMDD(today, 2),
          scheduledSlot: '16:00',
          estimatedMinutes: 25,
          blocksCount: 1,
          status: 'pending',
          completedVia: null,
          completedAt: null,
        },
      ]);
    }

    await db.users.update(user.id, { onboardingCompleted: true });
    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, activeTab: 'dashboard' });
  },

  addSubject: async (name, colorHex) => {
    const { user } = get();
    if (!user || !name.trim()) return null;
    const subject: Subject = {
      id: `sub_${user.id}_${Date.now().toString(36)}`,
      userId: user.id,
      name: name.trim(),
      colorHex,
    };
    await db.subjects.put(subject);
    await enqueueOfflineMutation(user.id, 'subject', 'create', { ...subject });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
    get().pushToast(`Materia "${subject.name}" guardada.`, 'success');
    return subject;
  },

  deleteSubject: async (subjectId) => {
    const { user } = get();
    if (!user) return;
    await db.subjects.delete(subjectId);
    await db.classBlocks.where('subjectId').equals(subjectId).delete();
    await enqueueOfflineMutation(user.id, 'subject', 'delete', { id: subjectId });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  addClassBlock: async (block) => {
    const { user } = get();
    if (!user) return;
    const item: ClassBlock = {
      ...block,
      id: `cb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      userId: user.id,
    };
    await db.classBlocks.put(item);
    await enqueueOfflineMutation(user.id, 'classBlock', 'create', { ...item });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
    get().pushToast('Bloque agregado al horario.', 'success');
  },

  deleteClassBlock: async (blockId) => {
    const { user } = get();
    if (!user) return;
    await db.classBlocks.delete(blockId);
    await enqueueOfflineMutation(user.id, 'classBlock', 'delete', { id: blockId });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  confirmAiDelivery: async (draft) => {
    const { user } = get();
    if (!user) return;
    const deliveryId = `del_${Date.now().toString(36)}`;
    const delivery: Delivery = {
      id: deliveryId,
      userId: user.id,
      subjectId: draft.subjectId,
      title: draft.title.trim(),
      inferredType: draft.proposal.inferredType,
      dueDate: draft.dueDate,
      instructionsText: draft.instructionsText,
      attachmentMeta: draft.attachmentMeta,
      createdVia: 'ai',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const tasks: MicroTask[] = draft.proposal.microTasks.map((m, idx) => ({
      id: `mt_${deliveryId}_${idx + 1}`,
      deliveryId,
      userId: user.id,
      title: m.title.trim(),
      scheduledDate: m.dayDate,
      scheduledSlot: m.suggestedTimeSlot,
      estimatedMinutes: m.estimatedMinutes,
      blocksCount: m.estimatedMinutes >= 45 ? 2 : 1,
      status: 'pending',
      completedVia: null,
      completedAt: null,
      rationale: m.rationale,
    }));

    await db.deliveries.put(delivery);
    await db.microTasks.bulkPut(tasks);
    await enqueueOfflineMutation(user.id, 'delivery', 'create', { deliveryId, count: tasks.length });
    const { newlyUnlocked } = await awardXpAndEvaluateBadges(user.id, 0);

    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, pendingAiDraft: null, planSubView: 'list' });
    get().pushToast(`Entrega agregada con ${tasks.length} micro-metas.`, 'success');
    if (newlyUnlocked.length > 0) {
      get().pushToast('¡Nueva medalla desbloqueada: Planificador IA!', 'success');
    }
  },

  createManualDelivery: async (input) => {
    const { user } = get();
    if (!user) return;
    const deliveryId = `del_${Date.now().toString(36)}`;
    const today = getTodayKey();
    const delivery: Delivery = {
      id: deliveryId,
      userId: user.id,
      subjectId: input.subjectId,
      title: input.title.trim(),
      inferredType: 'practice',
      dueDate: input.dueDate,
      instructionsText: input.instructionsText,
      createdVia: 'manual',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await db.deliveries.put(delivery);

    if (input.initialTaskTitle?.trim()) {
      await db.microTasks.put({
        id: `mt_${deliveryId}_1`,
        deliveryId,
        userId: user.id,
        title: input.initialTaskTitle.trim(),
        scheduledDate: today,
        scheduledSlot: '16:00',
        estimatedMinutes: 25,
        blocksCount: 1,
        status: 'pending',
        completedVia: null,
        completedAt: null,
      });
    }

    await enqueueOfflineMutation(user.id, 'delivery', 'create', { deliveryId, manual: true });
    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, planSubView: 'list' });
    get().pushToast('Entrega manual creada en tu Plan.', 'success');
  },

  addManualMicroTask: async (deliveryId, title, minutes, scheduledDate) => {
    const { user } = get();
    if (!user || !title.trim()) return;
    const task: MicroTask = {
      id: `mt_${deliveryId}_${Date.now().toString(36)}`,
      deliveryId,
      userId: user.id,
      title: title.trim(),
      scheduledDate,
      scheduledSlot: '16:00',
      estimatedMinutes: minutes,
      blocksCount: minutes >= 45 ? 2 : 1,
      status: 'pending',
      completedVia: null,
      completedAt: null,
    };
    await db.microTasks.put(task);
    await db.deliveries.update(deliveryId, { status: 'active' });
    await enqueueOfflineMutation(user.id, 'microTask', 'create', { id: task.id });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
  },

  toggleMicroTaskComplete: async (microTaskId, via = 'direct') => {
    const { user, microTasks, focusSessions } = get();
    if (!user) return;
    const target = microTasks.find((m) => m.id === microTaskId);
    if (!target) return;

    const completing = target.status !== 'completed';
    const nextStatus = completing ? 'completed' : 'pending';
    await db.microTasks.update(microTaskId, {
      status: nextStatus,
      completedVia: completing ? via : null,
      completedAt: completing ? new Date().toISOString() : null,
    });

    // Check if all tasks of parent delivery are now completed
    const siblings = await db.microTasks.where('deliveryId').equals(target.deliveryId).toArray();
    const allDone = siblings.length > 0 && siblings.every((s) => s.status === 'completed');
    await db.deliveries.update(target.deliveryId, { status: allDone ? 'completed' : 'active' });

    let xpDelta = 0;
    if (completing && via === 'direct') {
      xpDelta += XP_REWARDS.DIRECT_MICROTASK;
    } else if (!completing && target.completedVia === 'direct') {
      xpDelta -= XP_REWARDS.DIRECT_MICROTASK;
    }
    if (completing && allDone) {
      xpDelta += XP_REWARDS.DELIVERY_COMPLETED;
    }

    const today = getTodayKey();
    const updatedTasks = await db.microTasks.where('userId').equals(user.id).toArray();
    const streakUpdate = completing
      ? evaluateDailyStreakProgress({
          user,
          todayKey: today,
          microTasks: updatedTasks,
          focusSessions,
          respectedSleep: true,
        })
      : undefined;

    await awardXpAndEvaluateBadges(user.id, xpDelta, streakUpdate);
    await enqueueOfflineMutation(user.id, 'microTask', 'update', {
      id: microTaskId,
      status: nextStatus,
    });

    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);

    if (completing && via === 'direct') {
      const msg = allDone
        ? `¡Entrega completada! +${XP_REWARDS.DIRECT_MICROTASK + XP_REWARDS.DELIVERY_COMPLETED} XP`
        : `Micro-meta completada · +${XP_REWARDS.DIRECT_MICROTASK} XP`;
      get().pushToast(msg, 'success');
    }
  },

  deleteDelivery: async (deliveryId) => {
    const { user } = get();
    if (!user) return;
    await db.deliveries.delete(deliveryId);
    await db.microTasks.where('deliveryId').equals(deliveryId).delete();
    await enqueueOfflineMutation(user.id, 'delivery', 'delete', { id: deliveryId });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
    get().pushToast('Entrega eliminada.', 'info');
  },

  applyRebalanceMoves: async (moves) => {
    const { user } = get();
    if (!user || moves.length === 0) return;
    await db.transaction('rw', db.microTasks, async () => {
      for (const m of moves) {
        await db.microTasks.update(m.microTaskId, {
          scheduledDate: m.toDate,
          scheduledSlot: m.toSlot,
          status: 'pending',
        });
      }
    });
    await enqueueOfflineMutation(user.id, 'rebalance', 'update', { count: moves.length });
    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, planSubView: 'list' });
    get().pushToast(`Rebalanceo aplicado: ${moves.length} bloque(s) movidos.`, 'success');
  },

  openFocusWithTask: async (microTaskId, plannedMinutes) => {
    const { user, microTasks, activeTimer, clockOverride } = get();
    if (!user) return;
    const task = microTaskId ? microTasks.find((t) => t.id === microTaskId) : null;
    const mins = plannedMinutes ?? (task ? (task.estimatedMinutes >= 45 ? 45 : 25) : 25);
    const durationSec = clockOverride.fastFocusSeconds ?? mins * 60;

    const nextTimer: ActiveFocusTimerState = {
      ...(activeTimer ?? defaultTimer(user.id)),
      userId: user.id,
      mode: 'focus',
      plannedMinutes: mins,
      durationSec,
      startedAt: null,
      pausedRemainingSec: durationSec,
      microTaskId: task?.id ?? null,
      microTaskTitle: task?.title ?? null,
      interruptionsCount: 0,
    };
    await db.activeTimer.put(nextTimer);
    set({ activeTimer: nextTimer, activeTab: 'focus' });
  },

  setFocusDuration: async (minutes) => {
    const { activeTimer, clockOverride } = get();
    if (!activeTimer || activeTimer.startedAt !== null) return;
    const isBreak = minutes === 5;
    const durationSec = clockOverride.fastFocusSeconds ?? minutes * 60;
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      mode: isBreak ? 'break' : 'focus',
      plannedMinutes: minutes,
      durationSec,
      pausedRemainingSec: durationSec,
    };
    await db.activeTimer.put(updated);
    set({ activeTimer: updated });
  },

  setFocusShield: async (enabled) => {
    const { activeTimer } = get();
    if (!activeTimer) return;
    const updated = { ...activeTimer, shieldEnabled: enabled };
    await db.activeTimer.put(updated);
    set({ activeTimer: updated });
  },

  setFocusSound: async (sound) => {
    const { activeTimer } = get();
    if (!activeTimer) return;
    const updated = { ...activeTimer, ambientSound: sound };
    await db.activeTimer.put(updated);
    if (activeTimer.startedAt !== null) {
      audioEngine.start(sound);
    }
    set({ activeTimer: updated });
  },

  unlinkFocusMicroTask: async () => {
    const { activeTimer } = get();
    if (!activeTimer) return;
    const updated = { ...activeTimer, microTaskId: null, microTaskTitle: null };
    await db.activeTimer.put(updated);
    set({ activeTimer: updated });
  },

  startOrResumeFocus: async () => {
    const { activeTimer, config, clockOverride, user } = get();
    if (!activeTimer || !user) return;

    // Enforce strict curfew if configured
    if (config?.shieldRigidity === 'strict' && activeTimer.mode === 'focus') {
      const nowHHmm = getCurrentHHmm();
      if (nowHHmm >= config.curfewAlertTime) {
        set({ showCurfewModal: true });
        get().pushToast(
          'Modo Estricto activo: es hora de descanso. Reprograma o usa Emergencia.',
          'warning'
        );
        return;
      }
    }

    const baseRemaining =
      activeTimer.pausedRemainingSec ??
      clockOverride.fastFocusSeconds ??
      activeTimer.durationSec;

    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      durationSec: baseRemaining,
      startedAt: Date.now(),
      pausedRemainingSec: null,
    };
    await db.activeTimer.put(updated);
    audioEngine.start(updated.ambientSound);
    set({ activeTimer: updated });
  },

  pauseFocus: async () => {
    const { activeTimer } = get();
    if (!activeTimer || activeTimer.startedAt === null) return;
    const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    const remaining = Math.max(0, activeTimer.durationSec - elapsed);
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      startedAt: null,
      pausedRemainingSec: remaining,
    };
    await db.activeTimer.put(updated);
    audioEngine.stop();
    set({ activeTimer: updated });
  },

  resetFocus: async () => {
    const { activeTimer, clockOverride } = get();
    if (!activeTimer) return;
    const durationSec = clockOverride.fastFocusSeconds ?? activeTimer.plannedMinutes * 60;
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      startedAt: null,
      durationSec,
      pausedRemainingSec: durationSec,
      interruptionsCount: 0,
    };
    await db.activeTimer.put(updated);
    audioEngine.stop();
    set({ activeTimer: updated });
  },

  completeFocusBlock: async (completedEarly = false) => {
    const { activeTimer, user, microTasks, clockOverride } = get();
    if (!activeTimer || !user) return;
    audioEngine.stop();

    if (activeTimer.mode === 'break') {
      const nextDur = clockOverride.fastFocusSeconds ?? 25 * 60;
      const resetBreak: ActiveFocusTimerState = {
        ...activeTimer,
        mode: 'focus',
        plannedMinutes: 25,
        durationSec: nextDur,
        startedAt: null,
        pausedRemainingSec: nextDur,
      };
      await db.activeTimer.put(resetBreak);
      set({ activeTimer: resetBreak });
      sendLocalNotification('Pausa terminada', '¿Listo para el siguiente bloque de enfoque?');
      get().pushToast('Pausa regenerativa terminada.', 'info');
      return;
    }

    const elapsedSec =
      activeTimer.startedAt !== null
        ? Math.floor((Date.now() - activeTimer.startedAt) / 1000)
        : activeTimer.durationSec - (activeTimer.pausedRemainingSec ?? 0);

    const actualMinutes = completedEarly
      ? Math.max(1, Math.round(elapsedSec / 60))
      : activeTimer.plannedMinutes;

    const session: FocusSession = {
      id: `fs_${Date.now().toString(36)}`,
      userId: user.id,
      microTaskId: activeTimer.microTaskId,
      plannedMinutes: activeTimer.plannedMinutes,
      actualMinutes,
      completed: true,
      exitInterruptionsCount: activeTimer.interruptionsCount,
      ambientSound: activeTimer.ambientSound,
      startedAt: new Date(Date.now() - actualMinutes * 60000).toISOString(),
      endedAt: new Date().toISOString(),
    };
    await db.focusSessions.put(session);

    const today = getTodayKey();
    const allSessions = await db.focusSessions.where('userId').equals(user.id).toArray();
    const streakUpdate = evaluateDailyStreakProgress({
      user,
      todayKey: today,
      microTasks,
      focusSessions: allSessions,
      respectedSleep: true,
    });

    await awardXpAndEvaluateBadges(user.id, XP_REWARDS.FOCUS_BLOCK, streakUpdate);
    await enqueueOfflineMutation(user.id, 'focusSession', 'create', { ...session });

    const nextDuration = clockOverride.fastFocusSeconds ?? activeTimer.plannedMinutes * 60;
    const linkedId = activeTimer.microTaskId;
    const resetTimer: ActiveFocusTimerState = {
      ...activeTimer,
      startedAt: null,
      durationSec: nextDuration,
      pausedRemainingSec: nextDuration,
      interruptionsCount: 0,
    };
    await db.activeTimer.put(resetTimer);

    const refreshed = await reloadUserStateFromDb(user.id);
    set({
      ...refreshed,
      showCompleteModal: true,
      lastCompletedXp: XP_REWARDS.FOCUS_BLOCK,
      lastCompletedTaskId: linkedId,
    });
    sendLocalNotification('¡Bloque Focus completado!', `+${XP_REWARDS.FOCUS_BLOCK} XP ganados. Tu racha está protegida.`);
  },

  discardFocusBlock: async () => {
    const { activeTimer, clockOverride } = get();
    if (!activeTimer) return;
    audioEngine.stop();
    const dur = clockOverride.fastFocusSeconds ?? activeTimer.plannedMinutes * 60;
    const resetTimer: ActiveFocusTimerState = {
      ...activeTimer,
      startedAt: null,
      durationSec: dur,
      pausedRemainingSec: dur,
      interruptionsCount: 0,
    };
    await db.activeTimer.put(resetTimer);
    const pendingTab = get().pendingNavigationTab;
    set({
      activeTimer: resetTimer,
      showShieldModal: false,
      pendingNavigationTab: null,
      activeTab: pendingTab ?? 'dashboard',
    });
    get().pushToast('Bloque descartado. Tu racha sigue intacta.', 'info');
  },

  pauseFocusAndGoHome: async () => {
    await get().pauseFocus();
    const targetTab = get().pendingNavigationTab ?? 'dashboard';
    set({ showShieldModal: false, pendingNavigationTab: null, activeTab: targetTab });
    get().pushToast('Bloque pausado sin penalización.', 'info');
  },

  triggerShieldWarning: async () => {
    const { activeTimer } = get();
    if (!activeTimer || !activeTimer.shieldEnabled || activeTimer.startedAt === null) return;
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      interruptionsCount: activeTimer.interruptionsCount + 1,
    };
    await db.activeTimer.put(updated);
    set({ activeTimer: updated, showShieldModal: true });
  },

  startRegenerativeBreak: async () => {
    const { activeTimer, clockOverride } = get();
    if (!activeTimer) return;
    const breakSec = clockOverride.fastFocusSeconds ?? 5 * 60;
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      mode: 'break',
      plannedMinutes: 5,
      durationSec: breakSec,
      startedAt: Date.now(),
      pausedRemainingSec: null,
      microTaskId: null,
      microTaskTitle: null,
    };
    await db.activeTimer.put(updated);
    set({ activeTimer: updated, showCompleteModal: false, activeTab: 'focus' });
  },

  extendFocusPlus25: async () => {
    const { activeTimer, clockOverride } = get();
    if (!activeTimer) return;
    const dur = clockOverride.fastFocusSeconds ?? 25 * 60;
    const updated: ActiveFocusTimerState = {
      ...activeTimer,
      mode: 'focus',
      plannedMinutes: 25,
      durationSec: dur,
      startedAt: Date.now(),
      pausedRemainingSec: null,
    };
    await db.activeTimer.put(updated);
    audioEngine.start(updated.ambientSound);
    set({ activeTimer: updated, showCompleteModal: false, activeTab: 'focus' });
  },

  recordSleepCheckin: async (sleptHours) => {
    const { user, sleepLogs, microTasks, focusSessions } = get();
    if (!user) return;
    const today = getTodayKey();
    const existing = sleepLogs.find((s) => s.date === today);
    const respectedCurfew = sleptHours >= 7;

    if (existing) {
      await db.sleepLogs.update(existing.id, { sleptHours, respectedCurfew });
    } else {
      await db.sleepLogs.put({
        id: `sl_${user.id}_${today}`,
        userId: user.id,
        date: today,
        sleptHours,
        respectedCurfew,
        usedEmergency: false,
        emergencyMinutesUsed: 0,
        xpAwarded: sleptHours >= 7,
      });
    }

    const shouldAwardXp = sleptHours >= 7 && !existing?.xpAwarded;
    const streakUpdate = evaluateDailyStreakProgress({
      user,
      todayKey: today,
      microTasks,
      focusSessions,
      respectedSleep: sleptHours >= 6,
    });

    await awardXpAndEvaluateBadges(
      user.id,
      shouldAwardXp ? XP_REWARDS.SLEEP_HYGIENE : 0,
      streakUpdate
    );
    await enqueueOfflineMutation(user.id, 'sleepLog', 'create', { date: today, sleptHours });

    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
    get().pushToast(
      shouldAwardXp
        ? `Check-in guardado (${sleptHours}h) · +${XP_REWARDS.SLEEP_HYGIENE} XP`
        : `Check-in de sueño actualizado (${sleptHours}h).`,
      sleptHours >= 7 ? 'success' : 'info'
    );
  },

  rescheduleTodayAndSleep: async () => {
    const { user, microTasks, focusSessions, sleepLogs } = get();
    if (!user) return;
    const today = getTodayKey();
    const tomorrow = addDaysYYYYMMDD(today, 1);

    const pendingToday = microTasks.filter(
      (m) => m.scheduledDate === today && m.status === 'pending'
    );

    await db.transaction('rw', db.microTasks, async () => {
      for (const t of pendingToday) {
        await db.microTasks.update(t.id, {
          scheduledDate: tomorrow,
          scheduledSlot: '16:00',
        });
      }
    });

    const existingSleep = sleepLogs.find((s) => s.date === today);
    if (!existingSleep) {
      await db.sleepLogs.put({
        id: `sl_${user.id}_${today}`,
        userId: user.id,
        date: today,
        sleptHours: get().config?.sleepGoalHours ?? 7.5,
        respectedCurfew: true,
        usedEmergency: false,
        emergencyMinutesUsed: 0,
        xpAwarded: true,
      });
    } else {
      await db.sleepLogs.update(existingSleep.id, { respectedCurfew: true });
    }

    const updatedTasks = await db.microTasks.where('userId').equals(user.id).toArray();
    const streakUpdate = evaluateDailyStreakProgress({
      user,
      todayKey: today,
      microTasks: updatedTasks,
      focusSessions,
      respectedSleep: true,
    });
    const xpDelta = existingSleep?.xpAwarded ? 0 : XP_REWARDS.SLEEP_HYGIENE;
    await awardXpAndEvaluateBadges(user.id, xpDelta, streakUpdate);

    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, showCurfewModal: false, curfewDismissedForToday: true });
    get().pushToast(
      `Descansa bien: ${pendingToday.length} bloque(s) movidos a mañana. Racha protegida.`,
      'success'
    );
  },

  activateEmergencyMode: async () => {
    const { user, config, classBlocks, sleepLogs } = get();
    if (!user || !config) return { ok: false, error: 'Sin sesión activa.' };

    const today = getTodayKey();
    const tomorrow = addDaysYYYYMMDD(today, 1);
    const cap = computeSafeEmergencyCap(tomorrow, config, classBlocks);
    if (!cap.canUseEmergency) {
      return { ok: false, error: cap.reason ?? 'Cupo de emergencia agotado.' };
    }

    await db.wellnessConfigs.update(user.id, {
      emergencyUsedThisWeek: config.emergencyUsedThisWeek + 1,
    });

    const existingSleep = sleepLogs.find((s) => s.date === today);
    if (existingSleep) {
      await db.sleepLogs.update(existingSleep.id, {
        usedEmergency: true,
        emergencyMinutesUsed: cap.allowedMinutes,
      });
    } else {
      await db.sleepLogs.put({
        id: `sl_${user.id}_${today}`,
        userId: user.id,
        date: today,
        sleptHours: 6.5,
        respectedCurfew: true,
        usedEmergency: true,
        emergencyMinutesUsed: cap.allowedMinutes,
        xpAwarded: false,
      });
    }

    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, showCurfewModal: false, curfewDismissedForToday: true });
    get().pushToast(
      `Modo Emergencia activo (+${cap.allowedMinutes}m). Límite absoluto: ${cap.bedtimeHardFloorTime}.`,
      'warning'
    );
    return { ok: true };
  },

  updateWellnessConfig: async (partial) => {
    const { user } = get();
    if (!user) return;
    await db.wellnessConfigs.update(user.id, partial);
    await enqueueOfflineMutation(user.id, 'wellnessConfig', 'update', { ...partial });
    const refreshed = await reloadUserStateFromDb(user.id);
    set(refreshed);
    get().pushToast('Preferencias actualizadas.', 'success');
  },

  updateClockSim: async (partial) => {
    const next = setClockOverride(partial);
    const { activeTimer, config } = get();
    // If fastFocusSeconds changed and timer is idle, update its preview duration
    if ('fastFocusSeconds' in partial && activeTimer && activeTimer.startedAt === null) {
      const dur = next.fastFocusSeconds ?? activeTimer.plannedMinutes * 60;
      const updated = { ...activeTimer, durationSec: dur, pausedRemainingSec: dur };
      await db.activeTimer.put(updated);
      set({ activeTimer: updated });
    }
    const shouldShowCurfew =
      Boolean(config) && getCurrentHHmm() >= (config?.curfewAlertTime ?? '22:30');
    set({
      clockOverride: next,
      isOnline: next.simulateOffline ? false : typeof navigator !== 'undefined' ? navigator.onLine : true,
      showCurfewModal: shouldShowCurfew ? true : get().showCurfewModal,
    });
  },

  loadDemoDataset: async () => {
    const { user } = get();
    if (!user) return;
    await loadBuapDemoDataset(user.id);
    const refreshed = await reloadUserStateFromDb(user.id);
    set({ ...refreshed, showDevTools: false, activeTab: 'dashboard' });
    get().pushToast('Dataset de prueba BUAP cargado en IndexedDB.', 'success');
  },

  resetAllLocalData: async () => {
    audioEngine.stop();
    await db.delete();
    await db.open();
    setClockOverride({ dayOffset: 0, timeHHmm: null, fastFocusSeconds: null, simulateOffline: false });
    set({
      user: null,
      config: null,
      subjects: [],
      classBlocks: [],
      deliveries: [],
      microTasks: [],
      focusSessions: [],
      sleepLogs: [],
      badgeUnlocks: [],
      activeTimer: null,
      pendingSyncCount: 0,
      showDevTools: false,
      activeTab: 'dashboard',
      clockOverride: getClockOverride(),
    });
    get().pushToast('Base de datos local reiniciada.', 'info');
  },

  simulateSyncFlush: async () => {
    const { user } = get();
    if (!user) return;
    await db.syncQueue.where('synced').equals(0).modify({ synced: 1 });
    const pendingSyncCount = await db.syncQueue.where('synced').equals(0).count();
    set({ pendingSyncCount });
    get().pushToast('Cola offline lista (el backend se conectará en Fase 3).', 'info');
  },
}));
