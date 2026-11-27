import Dexie, { type Table } from 'dexie';
import type {
  ActiveFocusTimerState,
  AppSettingsRow,
  BadgeUnlock,
  ClassBlock,
  Delivery,
  FocusSession,
  MicroTask,
  OfflineMutation,
  SleepLog,
  Subject,
  User,
  UserWellnessConfig,
} from '../types/domain';

export class MicroPlanDB extends Dexie {
  users!: Table<User, string>;
  wellnessConfigs!: Table<UserWellnessConfig, string>;
  subjects!: Table<Subject, string>;
  classBlocks!: Table<ClassBlock, string>;
  deliveries!: Table<Delivery, string>;
  microTasks!: Table<MicroTask, string>;
  focusSessions!: Table<FocusSession, string>;
  sleepLogs!: Table<SleepLog, string>;
  badgeUnlocks!: Table<BadgeUnlock, string>;
  activeTimer!: Table<ActiveFocusTimerState, string>;
  syncQueue!: Table<OfflineMutation, number>;
  appSettings!: Table<AppSettingsRow, string>;

  constructor() {
    super('microplan_offline_db');
    this.version(1).stores({
      users: 'id, email',
      wellnessConfigs: 'userId',
      subjects: 'id, userId',
      classBlocks: 'id, userId, subjectId, dayOfWeek',
      deliveries: 'id, userId, subjectId, dueDate, status',
      microTasks: 'id, deliveryId, userId, scheduledDate, status',
      focusSessions: 'id, userId, microTaskId, startedAt',
      sleepLogs: 'id, userId, date, [userId+date]',
      badgeUnlocks: 'id, userId, badgeCode',
      activeTimer: 'id, userId',
      syncQueue: '++id, userId, synced, createdAt',
      appSettings: 'key',
    });
  }
}

export const db = new MicroPlanDB();

export async function enqueueOfflineMutation(
  userId: string,
  entity: string,
  action: 'create' | 'update' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  await db.syncQueue.add({
    userId,
    entity,
    action,
    payload,
    createdAt: new Date().toISOString(),
    synced: 0,
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.appSettings.get(key);
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await db.appSettings.delete(key);
  } else {
    await db.appSettings.put({ key, value });
  }
}
