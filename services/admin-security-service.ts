import { api } from './api';

export interface SecurityStatus {
  ipFilterEnabled: boolean;
  currentIP: string;
  allowedIPsCount: number;
  allowedIPRangesCount: number;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  loginDetectionEnabled: boolean;
  timestamp: string;
}

export interface SessionStats {
  totalActiveSessions: number;
  adminSessions: number;
  userSessions: number;
  timestamp: string;
}

export interface AdminSessionInfo {
  sessionId: string;
  adminEmail: string;
  adminId: number;
  loginTime: string;
  lastAccessTime: string;
  expired: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminSecurityProperties {
  enabled: boolean;
  allowedIps: string[];
  allowedIpRanges: string[];
  session: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    maxSessionsPreventsLogin: boolean;
  };
  reAuth: {
    requiredOperations: string[];
    tokenValidityMinutes: number;
  };
  loginDetection: {
    enabled: boolean;
    maxDistanceKm: number;
    unusualHours: string;
    notification: {
      email: string;
      slackWebhook?: string;
    };
  };
}

class AdminSecurityService {
  /**
   * IP 화이트리스트 테스트
   */
  async testIP() {
    const response = await api.get('/admin/security/ip-test');
    return response.data;
  }

  /**
   * 보안 설정 조회
   */
  async getSecuritySettings(): Promise<AdminSecurityProperties> {
    const response = await api.get('/admin/security/settings');
    return response.data;
  }

  /**
   * 보안 상태 확인
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    const response = await api.get('/admin/security/status');
    return response.data;
  }

  /**
   * IP 주소 유효성 검증
   */
  async validateIP(ip: string): Promise<{ ip: string; isValid: boolean }> {
    const response = await api.post('/admin/security/validate-ip', { ip });
    return response.data;
  }

  /**
   * CIDR 표기법 유효성 검증
   */
  async validateCIDR(cidr: string): Promise<{ cidr: string; isValid: boolean }> {
    const response = await api.post('/admin/security/validate-cidr', { cidr });
    return response.data;
  }

  // ============================================================================
  // 세션 관리 API
  // ============================================================================

  /**
   * 활성 관리자 세션 조회
   */
  async getActiveSessions(): Promise<AdminSessionInfo[]> {
    const response = await api.get('/admin/security/sessions');
    return response.data;
  }

  /**
   * 특정 관리자의 세션 조회
   */
  async getAdminSessions(adminEmail: string): Promise<AdminSessionInfo[]> {
    const response = await api.get(`/admin/security/sessions/${adminEmail}`);
    return response.data;
  }

  /**
   * 세션 통계
   */
  async getSessionStats(): Promise<SessionStats> {
    const response = await api.get('/admin/security/sessions/stats');
    return response.data;
  }

  /**
   * 세션 강제 종료
   */
  async invalidateSession(sessionId: string): Promise<{ success: boolean; sessionId: string; timestamp: string }> {
    const response = await api.delete(`/admin/security/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * 사용자 모든 세션 종료
   */
  async invalidateUserSessions(userEmail: string): Promise<{ expiredSessions: number; userEmail: string; timestamp: string }> {
    const response = await api.delete(`/admin/security/sessions/user/${userEmail}`);
    return response.data;
  }

  /**
   * 만료된 세션 정리
   */
  async cleanupExpiredSessions(): Promise<{ cleanedSessions: number; timestamp: string }> {
    const response = await api.post('/admin/security/sessions/cleanup');
    return response.data;
  }
}

export const adminSecurityService = new AdminSecurityService();