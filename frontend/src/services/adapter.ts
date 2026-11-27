import type { AiBreakdownResponse, RebalancePlan } from '../types/domain';
import {
  computeRebalancePlan,
  generateLocalBreakdown,
  type BreakdownInput,
} from './localAiPlanner';

/**
 * Pluggable service adapter for Phase 3 Backend + AI Agent integration.
 * During Phase 2 (Offline-First), runs locally on the device using IndexedDB data.
 */
export interface AiPlannerAdapter {
  readonly mode: 'local' | 'remote';
  breakdownDelivery(input: BreakdownInput): Promise<AiBreakdownResponse>;
  rebalanceSchedule(params: Parameters<typeof computeRebalancePlan>[0]): Promise<RebalancePlan>;
}

class LocalOfflineAiAdapter implements AiPlannerAdapter {
  readonly mode = 'local' as const;

  async breakdownDelivery(input: BreakdownInput): Promise<AiBreakdownResponse> {
    return generateLocalBreakdown(input);
  }

  async rebalanceSchedule(
    params: Parameters<typeof computeRebalancePlan>[0]
  ): Promise<RebalancePlan> {
    return computeRebalancePlan(params);
  }
}

export const aiPlannerAdapter: AiPlannerAdapter = new LocalOfflineAiAdapter();
