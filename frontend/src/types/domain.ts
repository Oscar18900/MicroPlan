export type AuthProvider = 'local' | 'google';
export type ShieldRigidity = 'soft' | 'balanced' | 'strict';
export type EmergencyMinutes = 30 | 45 | 60;
export type InferredDeliveryType = 'practice' | 'essay' | 'exam' | 'presentation' | 'project';
export type AmbientSoundType = 'silence' | 'white_noise' | 'rain';
export type BadgeCode =
  | 'racha_5'
  | 'sueno_7h'
  | 'escudo_zen'
  | 'planificador_ia'
  | 'racha_14'
  | 'semestre_zen';

export type AppTab = 'dashboard' | 'plan' | 'focus' | 'wellness' | 'profile';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  career: string;
  semester: string;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastStreakDate: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserWellnessConfig {
  userId: string;
  sleepGoalHours: 7.0 | 7.5 | 8.0;
  curfewAlertTime: string; // HH:mm e.g. "22:30"
  bedtimeLimitTime: string; // HH:mm e.g. "23:00"
  shieldRigidity: ShieldRigidity;
  emergencyMinutes: EmergencyMinutes;
  emergencyWeeklyQuota: number;
  emergencyUsedThisWeek: number;
  emergencyWeekStart: string; // YYYY-MM-DD
  dailyCapacityMinutes: number; // default 180
  leisureDays: number[]; // 1..7
  leisureStart: string; // "17:00"
  leisureEnd: string; // "18:00"
  leisureTags: string[];
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  colorHex: string;
}

export interface ClassBlock {
  id: string;
  userId: string;
  subjectId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5; // Lun-Vie
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  label: string;
}

export interface AttachmentMeta {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  extractedExcerpt?: string;
}

export interface Delivery {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  inferredType: InferredDeliveryType;
  dueDate: string; // YYYY-MM-DD
  instructionsText: string;
  attachmentMeta?: AttachmentMeta;
  createdVia: 'ai' | 'manual';
  status: 'active' | 'completed';
  createdAt: string;
}

export interface MicroTask {
  id: string;
  deliveryId: string;
  userId: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledSlot: string; // e.g. "16:00"
  estimatedMinutes: number; // 25 or 50
  blocksCount: number;
  status: 'pending' | 'completed' | 'rescheduled';
  completedVia: 'focus' | 'direct' | null;
  completedAt: string | null;
  rationale?: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  microTaskId: string | null;
  plannedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  exitInterruptionsCount: number;
  ambientSound: AmbientSoundType;
  startedAt: string;
  endedAt: string;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleptHours: number;
  respectedCurfew: boolean;
  usedEmergency: boolean;
  emergencyMinutesUsed: number;
  xpAwarded?: boolean;
}

export interface BadgeUnlock {
  id: string;
  userId: string;
  badgeCode: BadgeCode;
  unlockedAt: string;
}

export interface ActiveFocusTimerState {
  id: string; // 'current'
  userId: string;
  mode: 'focus' | 'break';
  plannedMinutes: number;
  durationSec: number;
  startedAt: number | null; // epoch ms when running
  pausedRemainingSec: number | null; // seconds remaining when paused
  microTaskId: string | null;
  microTaskTitle: string | null;
  shieldEnabled: boolean;
  ambientSound: AmbientSoundType;
  interruptionsCount: number;
}

export interface OfflineMutation {
  id?: number;
  userId: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
  synced: 0 | 1;
}

export interface AppSettingsRow {
  key: string;
  value: string;
}

export interface AiProposalMicroTask {
  tempId: string;
  title: string;
  dayDate: string;
  suggestedTimeSlot: string;
  estimatedMinutes: 25 | 50;
  blocksCount: number;
  rationale: string;
}

export interface AiBreakdownResponse {
  inferredType: InferredDeliveryType;
  totalEstimatedMinutes: number;
  totalBlocks: number;
  microTasks: AiProposalMicroTask[];
  warnings: string[];
  respectsConstraints: boolean;
  traceabilitySummary: string;
}

export interface RebalanceMove {
  microTaskId: string;
  title: string;
  subjectName: string;
  fromDate: string;
  toDate: string;
  toSlot: string;
  estimatedMinutes: number;
}

export interface RebalanceDaySummary {
  date: string;
  label: string;
  beforeMinutes: number;
  afterMinutes: number;
}

export interface RebalancePlan {
  overloadedDays: RebalanceDaySummary[];
  affectedDays: RebalanceDaySummary[];
  moves: RebalanceMove[];
  canRebalance: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}
