import type {
  AiBreakdownResponse,
  BadgeUnlock,
  ClassBlock,
  Delivery,
  FocusSession,
  MicroTask,
  SleepLog,
  Subject,
  User,
  UserWellnessConfig,
} from '../types/domain';

const TOKEN_STORAGE_KEY = 'microplan_auth_token';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:4000/api`;
  }
  return 'http://localhost:4000/api';
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export interface ServerSnapshot {
  user: User;
  config: UserWellnessConfig | null;
  subjects: Subject[];
  classBlocks: ClassBlock[];
  deliveries: Delivery[];
  microTasks: MicroTask[];
  focusSessions: FocusSession[];
  sleepLogs: SleepLog[];
  badgeUnlocks: BadgeUnlock[];
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  groqConfigured: boolean;
  groqModel: string;
  googleClientId: string | null;
}

export interface TelemetrySummary {
  totalUsers: number;
  activeUsers: number;
  totalDeliveries: number;
  aiBreakdownsCount: number;
  microTaskCompletionRatePct: number;
  avgSleepHours: number;
  curfewRespectPct: number;
  completedFocusBlocks: number;
  zeroDistractionBlocks: number;
}

export class ApiHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new ApiHttpError(res.status, data.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export async function apiHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/health');
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; snapshot: ServerSnapshot }> {
  return requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ token: string; snapshot: ServerSnapshot }> {
  return requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGoogleLogin(
  idToken: string
): Promise<{ token: string; snapshot: ServerSnapshot }> {
  return requestJson('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function apiBootstrap(): Promise<{ snapshot: ServerSnapshot }> {
  return requestJson('/bootstrap');
}

export async function apiSyncSnapshot(
  snapshot: ServerSnapshot
): Promise<{ ok: boolean; snapshot: ServerSnapshot }> {
  return requestJson('/sync/snapshot', {
    method: 'PUT',
    body: JSON.stringify(snapshot),
  });
}

export async function apiAiBreakdown(
  formData: FormData
): Promise<{ proposal: AiBreakdownResponse }> {
  return requestJson('/ai/breakdown', {
    method: 'POST',
    body: formData,
  });
}

export async function apiTelemetrySummary(): Promise<TelemetrySummary> {
  return requestJson('/telemetry/summary');
}
