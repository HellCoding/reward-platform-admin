import { api } from './api';

export interface AdminActionDTO {
  id: number;
  actionName: string;
  actionType: string;
  actionTypeKorean: string;
  description: string;
  successReward: number;
  failReward: number;
  dailyLimit: number;
  maxDailyReward: number;
  isActive: boolean;
  activeStatusKorean: string;
  ord: number;
  todayParticipations: number;
  todayUniqueUsers: number;
  adConfig?: AdminActionAdConfigDTO;
  adStatistics?: AdminActionAdStatisticsDTO;
}

export interface AdminActionAdConfigDTO {
  adConfigId: number;
  configName: string;
  actionId: number;
  additionalChances: number;
  dailyLimit: number;
  isActive: boolean;
  androidAdUnitId: string;
  iosAdUnitId: string;
  platformName: string;
  adTypeName: string;
  priority: number;
}

export interface AdminActionAdStatisticsDTO {
  actionId: number;
  actionName: string;
  todayAdWatches: number;
  todayExtraChancesGranted: number;
  todayExtraChancesUsed: number;
  adConversionRate: number;
  weeklyAdWatches: number;
  weeklyExtraChancesGranted: number;
  weeklyExtraChancesUsed: number;
  dailyAdLimit: number;
  averageDailyAdWatches: number;
}

export interface AdminActionAdConfigUpdateRequest {
  configName?: string;
  additionalChances?: number;
  dailyLimit?: number;
  isActive?: boolean;
  androidAdUnitId?: string;
  iosAdUnitId?: string;
  priority?: number;
}

export interface AdminActionStatisticsDTO {
  actionId: number;
  actionName: string;
  actionType: string;
  actionTypeKorean: string;
  participationCount: number;
  uniqueUsers: number;
  totalTicketsEarned: number;
  isActive: boolean;
  averageParticipationRate: number;
  averageTicketsPerUser: number;
}

export interface AdminActionUpdateRequest {
  actionName?: string;
  description?: string;
  successReward?: number;
  failReward?: number;
  dailyLimit?: number;
  maxDailyReward?: number;
  isActive?: boolean;
}

class ActionService {
  /**
   * 전체 액션 목록 조회 (쿠팡 파트너스 제외)
   */
  async getAllActions(): Promise<AdminActionDTO[]> {
    const response = await api.get('/admin/actions');
    return response.data;
  }

  /**
   * 액션 상세 정보 조회
   */
  async getAction(actionId: number): Promise<AdminActionDTO> {
    const response = await api.get(`/admin/actions/${actionId}`);
    return response.data;
  }

  /**
   * 액션 설정 업데이트
   */
  async updateAction(actionId: number, request: AdminActionUpdateRequest): Promise<AdminActionDTO> {
    const response = await api.put(`/admin/actions/${actionId}`, request);
    return response.data;
  }

  /**
   * 액션 활성화/비활성화 토글
   */
  async toggleActionActive(actionId: number): Promise<AdminActionDTO> {
    const response = await api.patch(`/admin/actions/${actionId}/toggle-active`);
    return response.data;
  }

  /**
   * 액션 순서 업데이트
   */
  async updateActionOrder(actionIds: number[]): Promise<void> {
    await api.put('/admin/actions/order', actionIds);
  }

  /**
   * 액션별 통계 조회
   */
  async getActionStatistics(days: number = 7): Promise<AdminActionStatisticsDTO[]> {
    const response = await api.get('/admin/actions/statistics', {
      params: { days }
    });
    return response.data;
  }

  /**
   * 액션 상세 통계 조회
   */
  async getActionDetailStatistics(actionId: number, days: number = 30): Promise<AdminActionStatisticsDTO> {
    const response = await api.get(`/admin/actions/${actionId}/statistics`, {
      params: { days }
    });
    return response.data;
  }

  // ================================ 광고 관련 메소드 ================================

  /**
   * 액션별 광고 설정 조회
   */
  async getActionAdConfig(actionId: number): Promise<AdminActionAdConfigDTO> {
    const response = await api.get(`/admin/actions/${actionId}/ad-config`);
    return response.data;
  }

  /**
   * 액션별 광고 설정 업데이트
   */
  async updateActionAdConfig(actionId: number, request: AdminActionAdConfigUpdateRequest): Promise<AdminActionAdConfigDTO> {
    const response = await api.put(`/admin/actions/${actionId}/ad-config`, request);
    return response.data;
  }

  /**
   * 액션별 광고 설정 생성
   */
  async createActionAdConfig(actionId: number, request: AdminActionAdConfigUpdateRequest): Promise<AdminActionAdConfigDTO> {
    const response = await api.post(`/admin/actions/${actionId}/ad-config`, request);
    return response.data;
  }

  /**
   * 액션별 광고 설정 삭제
   */
  async deleteActionAdConfig(actionId: number): Promise<void> {
    await api.delete(`/admin/actions/${actionId}/ad-config`);
  }

  /**
   * 액션별 광고 통계 조회
   */
  async getActionAdStatistics(actionId: number, days: number = 7): Promise<AdminActionAdStatisticsDTO> {
    const response = await api.get(`/admin/actions/${actionId}/ad-statistics`, {
      params: { days }
    });
    return response.data;
  }

  /**
   * 모든 액션의 광고 통계 요약 조회
   */
  async getAllActionAdStatistics(days: number = 7): Promise<AdminActionAdStatisticsDTO[]> {
    const response = await api.get('/admin/actions/ad-statistics/summary', {
      params: { days }
    });
    return response.data;
  }
}

export const actionService = new ActionService();
