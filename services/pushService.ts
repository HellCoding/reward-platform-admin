import { api } from './api';

// 푸시 알림 타입 정의
export interface NotificationType {
  TICKET_GET: "티켓 획득 가능";
  WINNER_BOX: "셔플박스 당첨";
  WINNER_LUCKY: "셔플뽑기 당첨";
  INVITE_FRIEND: "친구 초대 보상";
  INVITE_MILESTONE_5: "5명 초대 마일스톤";
  INVITE_MILESTONE_10: "10명 초대 마일스톤";
  EXTINCT_TICKET: "티켓 소멸 예정";
  EXTINCT_POINT: "포인트 소멸 예정";
  NOTICE: "공지사항";
}

// 즉시 발송 요청
export interface BroadcastPushRequest {
  title: string;
  body: string;
  notificationType: keyof NotificationType;
  actionTarget?: string;
  testMode?: boolean;
}

// 예약 발송 요청
export interface SchedulePushRequest {
  title: string;
  body: string;
  notificationType: keyof NotificationType;
  actionTarget?: string;
  testMode?: boolean;
  scheduledAt: string; // ISO 형식
}

// 예약 수정 요청
export interface PushScheduleUpdateRequest {
  title?: string;
  body?: string;
  notificationType?: keyof NotificationType;
  actionTarget?: string;
  scheduledAt?: string;
}

// 예약 취소 요청
export interface PushScheduleCancelRequest {
  cancelReason: string;
}

// 즉시 발송 응답
export interface PushBroadcastResultResponse {
  broadcastId: number;
  totalUserCount: number;
  eligibleUserCount: number;
  sentDeviceCount: number;
  testMode: boolean;
  sentAt: string;
}

// 예약 응답
export interface PushScheduleResponse {
  id: number;
  title: string;
  body: string;
  notificationType: keyof NotificationType;
  actionTarget?: string;
  scheduledAt: string;
  executed: boolean;
  executionTime?: string;
  broadcastId?: number;
  createdBy: string;
  canceled: boolean;
  cancelReason?: string;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
}

// 발송 이력 응답
export interface PushBroadcastHistoryResponse {
  id: number;
  title: string;
  body: string;
  notificationType: keyof NotificationType;
  actionTarget?: string;
  sentAt: string;
  totalUserCount: number;
  eligibleUserCount: number;
  sentDeviceCount: number;
  testMode: boolean;
}

// 페이지네이션 응답
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

class PushService {
  // 즉시 발송
  async broadcastPush(request: BroadcastPushRequest): Promise<PushBroadcastResultResponse> {
    const response = await api.post('/admin/push/broadcast', request);
    return response.data;
  }

  // 예약 발송 생성
  async scheduleNotification(request: SchedulePushRequest): Promise<PushScheduleResponse> {
    const response = await api.post('/admin/push/schedule', request);
    return response.data;
  }

  // 예약 목록 조회
  async getSchedules(status: string = 'all', page: number = 0, size: number = 20): Promise<PageResponse<PushScheduleResponse>> {
    const response = await api.get('/admin/push/schedule', {
      params: { status, page, size }
    });
    return response.data;
  }

  // 예약 상세 조회
  async getSchedule(scheduleId: number): Promise<PushScheduleResponse> {
    const response = await api.get(`/admin/push/schedule/${scheduleId}`);
    return response.data;
  }

  // 예약 수정
  async updateSchedule(scheduleId: number, request: PushScheduleUpdateRequest): Promise<PushScheduleResponse> {
    const response = await api.put(`/admin/push/schedule/${scheduleId}`, request);
    return response.data;
  }

  // 예약 취소
  async cancelSchedule(scheduleId: number, request: PushScheduleCancelRequest): Promise<PushScheduleResponse> {
    const response = await api.post(`/admin/push/schedule/${scheduleId}/cancel`, request);
    return response.data;
  }

  // 기간별 예약 조회
  async getSchedulesByPeriod(startDate: string, endDate: string): Promise<PushScheduleResponse[]> {
    const response = await api.get('/admin/push/schedule/period', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  // 발송 이력 조회
  async getPushBroadcastHistory(page: number = 0, size: number = 20): Promise<PageResponse<PushBroadcastHistoryResponse>> {
    const response = await api.get('/admin/push/history', {
      params: { page, size }
    });
    return response.data;
  }

  // 기간별 발송 이력 조회
  async getPushBroadcastHistoryByPeriod(startDate: string, endDate: string): Promise<PushBroadcastHistoryResponse[]> {
    const response = await api.get('/admin/push/history/period', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  // 알림 타입별 발송 이력 조회
  async getPushBroadcastHistoryByType(notificationType: keyof NotificationType): Promise<PushBroadcastHistoryResponse[]> {
    const response = await api.get('/admin/push/history/type', {
      params: { notificationType }
    });
    return response.data;
  }

  // 푸시 대시보드 통계 정보 조회
  async getDashboardStats(): Promise<PushDashboardStats> {
    try {
      const response = await api.get('/admin/push/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // 에러 시 기본값 반환
      return {
        todaySent: 0,
        pendingSchedules: 0,
        totalSchedules: 0,
        weekSent: 0
      };
    }
  }

  // 최근 예약 목록 조회 (최대 5개)
  async getRecentSchedules(): Promise<PushScheduleResponse[]> {
    try {
      const response = await this.getSchedules('all', 0, 5);
      return response.content;
    } catch (error) {
      console.error('Failed to fetch recent schedules:', error);
      return [];
    }
  }

  // 최근 발송 이력 조회 (최대 5개)
  async getRecentHistory(): Promise<PushBroadcastHistoryResponse[]> {
    try {
      const response = await this.getPushBroadcastHistory(0, 5);
      return response.content;
    } catch (error) {
      console.error('Failed to fetch recent history:', error);
      return [];
    }
  }
}

// 대시보드 통계 타입 정의
export interface PushDashboardStats {
  todaySent: number;
  pendingSchedules: number;
  totalSchedules: number;
  weekSent: number;
}

export default new PushService();
