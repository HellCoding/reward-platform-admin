import { api } from './api';

// 타임미션 관련 타입 정의
export interface TimeMission {
  id: number;
  missionName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  assignmentType: 'FIXED_BY_DAY' | 'RANDOM' | 'FIXED_ACTION';
  gameCount: number;
  participationLimitPerGame: number;
  description?: string;
  pushEnabled: boolean;
  pushTitleTemplate?: string;
  pushMessageTemplate?: string;
  displayOrder: number;
  pushNotificationTime?: string;
  activeDaysOfWeek?: string;
  targetActionId?: number;
  createdBy?: number;
  modifiedBy?: number;
}

export interface TimeMissionSession {
  id: number;
  timeMissionId: number;
  timeMission?: TimeMission;
  sessionDate: string;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  totalParticipants: number;
  totalParticipations: number;
  pushSent: boolean;
  pushSentTime?: string;
}

export interface TimeMissionDailyStatus {
  date: string;
  totalParticipants: number;
  totalParticipations: number;
  totalEarnedTickets: number;
  sessionStatuses: SessionStatus[]; // 🔄 세션별로 변경
}

// 🆕 세션별 현황 인터페이스
export interface SessionStatus {
  sessionId: number;
  sessionDisplayName: string; // 미션명 + 날짜
  missionName: string;
  sessionDate: string;
  selectedActions: string; // 선택된 액션 ID들
  participants: number;
  totalParticipations: number;
  totalEarnedTickets: number;
}

// 🗑️ 기존 MissionStatus는 하위 호환성을 위해 유지
export interface MissionStatus {
  missionId: number;
  missionName: string;
  startTime: string;
  endTime: string;
  participants: number;
  totalParticipations: number;
  totalEarnedTickets: number;
  isActiveToday: boolean;
  sessionExists: boolean;
}

export interface TimeMissionStats {
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalParticipants: number;
  totalParticipations: number;
  averageParticipationsPerSession: number;
  sessions: TimeMissionSession[];
}

export const timeMissionService = {
  // 모든 타임미션 목록 조회
  async getAllTimeMissions(): Promise<TimeMission[]> {
    const response = await api.get('/admin/time-missions');
    return response.data;
  },

  // 특정 타임미션 상세 조회
  async getTimeMission(id: number): Promise<TimeMission> {
    const response = await api.get(`/admin/time-missions/${id}`);
    return response.data;
  },

  // 타임미션 생성
  async createTimeMission(timeMission: Partial<TimeMission>): Promise<TimeMission> {
    const response = await api.post('/admin/time-missions', timeMission);
    return response.data;
  },

  // 타임미션 수정
  async updateTimeMission(id: number, timeMission: Partial<TimeMission>): Promise<TimeMission> {
    const response = await api.put(`/admin/time-missions/${id}`, timeMission);
    return response.data;
  },

  // 타임미션 삭제 (비활성화)
  async deleteTimeMission(id: number): Promise<void> {
    await api.delete(`/admin/time-missions/${id}`);
  },

  // 타임미션 세션 목록 조회
  async getTimeMissionSessions(date: string): Promise<TimeMissionSession[]> {
    const response = await api.get('/admin/time-missions/sessions', {
      params: { date }
    });
    return response.data;
  },

  // 타임미션 일일 현황 조회
  async getDailyStatus(date: string): Promise<TimeMissionDailyStatus> {
    const response = await api.get('/admin/time-missions/daily-status', {
      params: { date }
    });
    return response.data;
  },

  // 타임미션 통계 조회
  async getTimeMissionStatistics(startDate: string, endDate: string): Promise<TimeMissionStats> {
    const response = await api.get('/admin/time-missions/statistics', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // 타임미션 현황 조회 (리포트용)
  async getTimeMissionReport(date: string): Promise<SessionStatus[]> {
    const dailyStatus = await this.getDailyStatus(date);
    return dailyStatus.sessionStatuses || [];
  }
};
