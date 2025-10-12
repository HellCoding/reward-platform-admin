import { api } from './api';

/**
 * 대시보드 서비스
 * 대시보드 관련 API 호출 함수들
 */
export const dashboardService = {
  /**
   * 대시보드 요약 정보 조회
   */
  getDashboardSummary: async () => {
    const response = await api.get('/admin/statistics/summary');
    return response;
  },
  
  /**
   * 사용자 증가 추이 데이터 조회
   * @param days 조회할 일수 (기본값: 30일)
   */
  getUserGrowth: async (days = 30) => {
    const response = await api.get(`/admin/dashboard/user-growth?days=${days}`);
    return response;
  },
  
  /**
   * 활동 추이 데이터 조회
   * @param days 조회할 일수 (기본값: 7일)
   */
  getActivityTrend: async (days = 7) => {
    const response = await api.get(`/admin/dashboard/activity-trend?days=${days}`);
    return response;
  },
  
  /**
   * 최근 활동 조회
   * @param limit 조회할 활동 수 (기본값: 10개)
   */
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/admin/dashboard/recent-activities?limit=${limit}`);
    return response;
  },
  
  /**
   * 배치 스크립트 결과 업로드 (관리자 전용)
   * @param batchOutput 배치 스크립트 출력 텍스트
   * @param date 통계 날짜 (기본값: 어제)
   */
  uploadBatchResult: async (batchOutput: string, date?: string) => {
    const url = date 
      ? `/admin/dashboard/batch-result?date=${date}`
      : '/admin/dashboard/batch-result';
    
    const response = await api.post(url, batchOutput, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    return response;
  }
};