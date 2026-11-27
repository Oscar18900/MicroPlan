import type { AiBreakdownResponse, RebalancePlan } from '../types/domain';
import { apiAiBreakdown, getAuthToken } from './apiClient';
import {
  computeRebalancePlan,
  generateLocalBreakdown,
  type BreakdownInput,
} from './localAiPlanner';
import { getClockOverride, getTodayKey } from './timeService';

/**
 * Hybrid AI Planner Adapter:
 * - Online + authenticated: sends task/rubric/file to Backend Groq AI Agent (/api/ai/breakdown).
 * - Offline or network fallback: seamlessly runs local heuristic breakdown on-device.
 */
export interface AiPlannerAdapter {
  readonly mode: 'hybrid' | 'local';
  breakdownDelivery(input: BreakdownInput): Promise<AiBreakdownResponse>;
  rebalanceSchedule(params: Parameters<typeof computeRebalancePlan>[0]): Promise<RebalancePlan>;
}

class HybridAiPlannerAdapter implements AiPlannerAdapter {
  readonly mode = 'hybrid' as const;

  async breakdownDelivery(input: BreakdownInput): Promise<AiBreakdownResponse> {
    const token = getAuthToken();
    const offlineSim = getClockOverride().simulateOffline;
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (token && online && !offlineSim) {
      try {
        const formData = new FormData();
        formData.append('subjectName', input.subjectName);
        formData.append('title', input.title);
        formData.append('dueDate', input.dueDate);
        formData.append('instructionsText', input.instructionsText);
        formData.append('todayKey', getTodayKey());
        if (input.attachmentFile) {
          formData.append('attachment', input.attachmentFile);
        }
        const { proposal } = await apiAiBreakdown(formData);
        return { ...proposal, provider: 'groq' };
      } catch (err) {
        console.warn('Groq backend unavailable, falling back to local planner:', err);
      }
    }

    const localProposal = generateLocalBreakdown(input);
    return {
      ...localProposal,
      provider: 'local',
      modelUsed: 'offline-heuristics',
    };
  }

  async rebalanceSchedule(
    params: Parameters<typeof computeRebalancePlan>[0]
  ): Promise<RebalancePlan> {
    return computeRebalancePlan(params);
  }
}

export const aiPlannerAdapter: AiPlannerAdapter = new HybridAiPlannerAdapter();
