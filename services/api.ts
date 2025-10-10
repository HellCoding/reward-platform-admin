import axios from 'axios';
import { isReadOnlyMode, getReadOnlyModeMessage } from '@/lib/utils/env';

// UserDTO 인터페이스 정의
interface UserDTO {
  id: number;         // Long 값
  name: string;
  nickname?: string;
  email: string;
  loginType: string;  // AuthProvider enum 값
  profileImageUrl?: string;
  phoneNumber?: string;
  tokenVersion: number;
  gender?: string;
  pushSettings?: any;
  appSettings?: any;
  devices?: any[];
  balance?: any;
  role?: string;      // 역할 정보 추가
}

// KakaoLoginResponse 인터페이스 정의
interface KakaoLoginResponse {
  registrationRequired: number;  // 0: 불필요, 1: 필요
  temporaryToken?: string;      // 회원가입 시 사용
  tokens?: {
    accessToken: string;
    refreshToken: string;
    kakaoTokens?: any;
    appleTokens?: any;
    expirationInfo?: any;
    deviceInfo?: any;
  };
  email?: string;
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  deviceInfo?: any;
  role?: string;     // 역할 정보 추가
}

// 기본 API 클라이언트 설정 - 상대 경로 사용 (Next.js rewrites로 프록시 처리)
export const api = axios.create({
  baseURL: '/api',  // 항상 상대 경로 사용
  headers: {
    'Content-Type': 'application/json',
  },
});

// 디버깅용 로그 추가 (프로덕션에서는 최소화)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Base URL (상대 경로):', '/api');
  if (typeof window !== 'undefined') {
    console.log('🔧 현재 도메인:', window.location.origin);
    console.log('🔧 실제 API 요청 URL:', window.location.origin + '/api');
  }
}

// 요청 인터셉터 - 인증이 필요한 요청에만 토큰 추가 + 읽기 전용 모드 체크
api.interceptors.request.use(
  (config) => {
    // 인증이 필요하지 않은 엔드포인트 목록 (먼저 체크)
    const noAuthEndpoints = [
      '/auth/login',
      '/auth/login/kakao',
      '/auth/login/apple',
      '/auth/token/refresh'
    ];

    // 현재 요청이 인증이 필요하지 않은 엔드포인트인지 확인
    const isNoAuthRequest = noAuthEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    // 읽기 전용 모드에서 쓰기 작업 차단 (로그인 API는 예외)
    const writeOperations = ['post', 'put', 'patch', 'delete'];
    const isWriteOperation = writeOperations.includes(config.method?.toLowerCase() || '');
    
    if (isWriteOperation && !isNoAuthRequest && typeof window !== 'undefined' && isReadOnlyMode()) {
      console.warn('🔒 읽기 전용 모드에서 쓰기 작업이 차단되었습니다:', config.method?.toUpperCase(), config.url);
      
      const error = new Error(getReadOnlyModeMessage());
      error.name = 'ReadOnlyModeError';
      return Promise.reject(error);
    }

    // 인증이 필요한 엔드포인트에만 토큰 추가
    if (!isNoAuthRequest) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === 'development') {
      const readOnlyStatus = typeof window !== 'undefined' ? isReadOnlyMode() : 'unknown';
      console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url} ${isNoAuthRequest ? '(인증 제외)' : '(인증 포함)'} [ReadOnly: ${readOnlyStatus}]`);
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API 요청 오류:', error);
    }
    return Promise.reject(error);
  }
);

// 토큰 갱신 관련 변수들
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// 응답 인터셉터 - 401 에러 시 리프레시 토큰으로 자동 갱신 (단순화)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 로그인 또는 리프레시 요청인지 확인
    const isAuthRequest = originalRequest?.url?.includes('/auth/login') || 
                         originalRequest?.url?.includes('/auth/token/refresh');

    // 401 에러이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      console.log('🔄 401 에러 감지, 토큰 갱신 시도:', {
        url: originalRequest?.url,
        isRefreshing: isRefreshing,
        hasRefreshPromise: !!refreshPromise
      });
      
      originalRequest._retry = true;

      // 이미 토큰 갱신 중인 경우 같은 Promise를 재사용
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // 새로운 토큰 갱신 시작
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.warn('🔄 리프레시 토큰이 없어 자동 갱신할 수 없습니다. 로그아웃 처리합니다.');
          // 토큰이 없으면 조용히 로그아웃 처리
          localStorage.removeItem('token');
          sessionStorage.removeItem('userData');
          sessionStorage.removeItem('processedKakaoCode');

          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
        }

        // 단일 갱신 Promise 생성
        refreshPromise = (async () => {
          const response = await axios.post('/api/auth/token/refresh', { 
            refreshToken 
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // 새 토큰 저장
          localStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          return accessToken;
        })();

        const newToken = await refreshPromise;

        // 원본 요청에 새 토큰 적용 후 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('🔄 토큰 갱신 실패:', refreshError);
        
        // 토큰 갱신 실패 시 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('processedKakaoCode');

        // 로그인 페이지로 리디렉션 (현재 페이지가 로그인 페이지가 아닌 경우)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔄 로그인 페이지로 리디렉션');
          window.location.href = '/login';
        }

        return Promise.reject(new Error('로그인이 만료되었습니다. 다시 로그인해주세요.'));
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    // 403 에러 (접근 권한 없음) 처리 - 간소화
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         '접근 권한이 없습니다.';

      error.message = errorMessage;

      // 관리자 기능 요청이 아닌 경우에만 로그인 페이지로 리디렉션
      const isAdminFunctionRequest = originalRequest?.url?.includes('/admin/users/') && 
                                   (originalRequest?.url?.includes('/suspend') || 
                                    originalRequest?.url?.includes('/unsuspend') ||
                                    originalRequest?.url?.includes('/status'));

      if (!isAdminFunctionRequest && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }

    return Promise.reject(error);
  }
);

// Auth 서비스
export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });

      // 토큰 저장
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // 사용자 정보 저장
      const userData = {
        id: response.data.email || '',
        username: response.data.email || '',
        name: response.data.name || '관리자',
        role: response.data.role || 'ADMIN'
      };

      sessionStorage.setItem('userData', JSON.stringify(userData));

      return {
        user: userData
      };
    } catch (error) {
      throw error;
    }
  },

  // 카카오 로그인 처리 (단순화)
  loginWithKakao: async (code: string) => {
    // 동적 redirect URI 결정
    const getRedirectUri = () => {
      if (typeof window === 'undefined') {
        // SSR 환경에서는 프로덕션 URL 반환
        return 'https://admin.reward-platform.kr/auth/kakao/callback';
      }

      const origin = window.location.origin;
      
      if (origin.includes('reward-platformdev-admin.example.com')) {
        return 'https://reward-platformdev-admin.example.com/auth/kakao/callback';
      } else if (origin.includes('localhost')) {
        return 'http://localhost:8023/auth/kakao/callback';
      } else {
        // 프로덕션 환경 (admin.reward-platform.kr)
        return 'https://admin.reward-platform.kr/auth/kakao/callback';
      }
    };

    const redirectUri = getRedirectUri();

    const deviceInfo = {
      deviceType: 'WEB',
      pushToken: '',
      deviceModel: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: '1.0.0'
    };

    try {
      const response = await api.post<KakaoLoginResponse>('/auth/login/kakao', {
        authorizationCode: code,
        redirectUri: redirectUri,
        deviceInfo: deviceInfo
      });

      const responseData = response.data;

      // 회원가입 필요 여부 확인
      if (responseData.registrationRequired === 1) {
        throw new Error('관리자 계정이 없습니다. 회원가입이 필요합니다.');
      }

      // 토큰 저장
      if (responseData.tokens && responseData.tokens.accessToken) {
        console.log('🔐 토큰 저장 시작:', {
          hasAccessToken: !!responseData.tokens.accessToken,
          hasRefreshToken: !!responseData.tokens.refreshToken
        });
        
        localStorage.setItem('token', responseData.tokens.accessToken);

        if (responseData.tokens.refreshToken) {
          localStorage.setItem('refreshToken', responseData.tokens.refreshToken);
          console.log('🔐 리프레시 토큰 저장 완료');
        } else {
          console.warn('🔐 ⚠️ 응답에 리프레시 토큰이 없습니다!');
        }
        
        // 토큰 저장 직후 검증
        setTimeout(() => {
          const storedToken = localStorage.getItem('token');
          const storedRefreshToken = localStorage.getItem('refreshToken');
          console.log('🔐 토큰 저장 검증:', {
            tokenSaved: !!storedToken,
            refreshTokenSaved: !!storedRefreshToken,
            tokenLength: storedToken?.length || 0,
            refreshTokenLength: storedRefreshToken?.length || 0
          });
        }, 100);
      } else {
        throw new Error('토큰이 응답에 포함되지 않았습니다.');
      }

      // 관리자 권한 체크
      const userRole = responseData.role || 'USER';

      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw new Error('ADMIN_PERMISSION_REQUIRED');
      }

      return {
        email: responseData.email,
        name: responseData.name || '관리자',
        role: userRole,
        tokens: responseData.tokens
      };
    } catch (error: any) {
      // 에러 메시지 개선
      let errorMessage = "카카오 로그인 중 오류가 발생했습니다.";

      if (error?.message === 'ADMIN_PERMISSION_REQUIRED') {
        errorMessage = '🚫 관리자 권한이 필요합니다\n\n일반 사용자는 관리자 페이지에 접근할 수 없습니다.\n관리자 계정으로 다시 로그인해주세요.';
      } else if (error?.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error?.message && error.message !== 'ADMIN_PERMISSION_REQUIRED') {
        errorMessage = error.message;
      }

      const newError = new Error(errorMessage);
      throw newError;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // 서버 로그아웃 실패해도 클라이언트 데이터는 정리
    } finally {
      // 모든 클라이언트 데이터 완전 정리
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('processedKakaoCode');
    }
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await api.get<UserDTO>('/users/me');

      return {
        id: response.data.email,
        username: response.data.email,
        name: response.data.name || '관리자',
        role: response.data.role || 'USER',
        email: response.data.email,
        profileImageUrl: response.data.profileImageUrl
      };
    } catch (error) {
      // 세션 스토리지에서 캐시된 사용자 정보 시도
      const cachedUserData = sessionStorage.getItem('userData');
      if (cachedUserData) {
        return JSON.parse(cachedUserData);
      }

      throw error;
    }
  },

  // 토큰 갱신 (단순화)
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    const response = await api.post('/auth/token/refresh', { refreshToken });

    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response.data;
  },
};

// 사용자 서비스
export const userService = {
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });

      // 백엔드 응답 구조 확인 및 변환
      if (response.data && response.data.content) {
        const transformedContent = response.data.content.map((item: any) => ({
          userId: item.userInfo?.userId || item.userId || Math.floor(Math.random() * 10000),
          name: item.userInfo?.name || item.name || 'N/A',
          phoneNumber: item.userInfo?.phoneNumber || item.phoneNumber || 'N/A',
          email: item.userInfo?.email || item.email || 'N/A',
          loginProvider: item.userInfo?.loginProvider || item.loginProvider || 'N/A',
          status: item.userInfo?.status || item.status || 'ACTIVE',
          registeredAt: item.userInfo?.registeredAt || item.registeredAt || new Date().toISOString(),
          lastAccessDate: item.activityInfo?.lastAccessDate || item.lastAccessDate || new Date().toISOString(),
          gender: item.userInfo?.gender || item.gender || '',
          profileImageUrl: item.userInfo?.profileImageUrl || item.profileImageUrl || undefined // 프로필 이미지 URL 추가
        }));

        return {
          content: transformedContent,
          page: response.data.page || 0,
          size: response.data.size || 20,
          totalElements: response.data.totalElements || transformedContent.length,
          totalPages: response.data.totalPages || 1
        };
      }
    } catch (error) {
      // API 실패는 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('사용자 목록 API 호출 실패:', error);
      }
    }

    // 목 데이터 제공 (개발용)
    const statuses = ['ACTIVE', 'SUSPENDED', 'DORMANT', 'WITHDRAWN'] as const;
    const providers = ['KAKAO', 'APPLE', 'EMAIL'] as const;
    const genders = ['M', 'F', ''] as const;

    const mockUsers = Array.from({ length: 100 }, (_, i) => {
      let status: 'ACTIVE' | 'SUSPENDED' | 'DORMANT' | 'WITHDRAWN';
      if (i % 10 === 0) {
        status = 'WITHDRAWN';
      } else if (i % 15 === 0) {
        status = 'SUSPENDED';
      } else if (i % 20 === 0) {
        status = 'DORMANT';
      } else {
        status = 'ACTIVE';
      }

      return {
        userId: i + 1,
        name: `사용자${i + 1}`,
        phoneNumber: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        email: `user${i + 1}@example.com`,
        loginProvider: providers[Math.floor(Math.random() * providers.length)],
        status: status,
        registeredAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        lastAccessDate: status === 'WITHDRAWN' 
          ? new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString()
          : new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        gender: genders[Math.floor(Math.random() * genders.length)],
        // 일부 사용자에게만 프로필 이미지 URL 추가 (카카오 CDN 형태 또는 undefined)
        profileImageUrl: i % 4 === 0 ? 
          `https://k.kakaocdn.net/dn/sample${i}/profile/img_640x640.jpg` : 
          undefined
      };
    });

    return {
      content: mockUsers,
      page: 0,
      size: mockUsers.length,
      totalElements: mockUsers.length,
      totalPages: 1
    };
  },
  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  updateUserStatus: async (userId: number, data: { status: string; reason: string }) => {
    const response = await api.put(`/admin/users/${userId}/status`, data);
    return response.data;
  },
  suspendUser: async (userId: number, data: { reason: string }) => {
    const response = await api.post(`/admin/users/${userId}/suspend`, data);
    return response.data;
  },
  unsuspendUser: async (userId: number, reason: string) => {
    const response = await api.post(`/admin/users/${userId}/unsuspend`, null, {
      params: { reason }
    });
    return response.data;
  },
  getUserTransactions: async (userId: string, type: 'point' | 'ticket', params = {}) => {
    const response = await api.get(`/admin/users/${userId}/transactions/${type}`, { params });
    return response.data;
  },
  getUserGameHistory: async (userId: string, params = {}) => {
    const response = await api.get(`/admin/users/${userId}/games`, { params });
    return response.data;
  },
  getUserInviteInfo: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/invites`);
    return response.data;
  },
  getUserActivities: async (userId: string, params = {}) => {
    const response = await api.get(`/admin/users/${userId}/activities`, { params });
    return response.data;
  },
  getUserStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/users/stats', { params });
      return response.data;
    } catch (error) {
      return {
        totalUsers: 100,
        activeUsers: 78,
        suspendedUsers: 7,
        dormantUsers: 5,
        withdrawnUsers: 10,
        todayNewUsers: 2
      };
    }
  },
  getSuspiciousUsers: async (params = {}) => {
    const response = await api.get('/admin/users/suspicious', { params });
    return response.data;
  },
  bulkUpdateUsers: async (userIds: number[], action: string, reason?: string) => {
    const response = await api.post('/admin/users/bulk', {
      userIds,
      action,
      reason
    });
    return response.data;
  }
};

// 이벤트 서비스
export const eventService = {
  getEvents: async (params = {}) => {
    const response = await api.get('/admin/events', { params });
    return response.data;
  },
  getEventById: async (id: string) => {
    const response = await api.get(`/admin/events/${id}`);
    return response.data;
  },
  createEvent: async (data: any) => {
    const response = await api.post('/admin/events', data);
    return response.data;
  },
  updateEvent: async (id: string, data: any) => {
    const response = await api.put(`/admin/events/${id}`, data);
    return response.data;
  },
  deleteEvent: async (id: string) => {
    const response = await api.delete(`/admin/events/${id}`);
    return response.data;
  },
};

// 통계 서비스
export const statsService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/statistics/dashboard');
    return response.data;
  },
  getUserStats: async (params = {}) => {
    const response = await api.get('/admin/statistics/users', { params });
    return response.data;
  },
  getActivityStats: async (params = {}) => {
    const response = await api.get('/admin/statistics/activities', { params });
    return response.data;
  },
  getDashboardSummary: async () => {
    const response = await api.get('/admin/statistics/summary');
    return response;
  },
  getUserGrowth: async (days = 30) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`/admin/statistics/daily?startDate=${startDate}&endDate=${endDate}`);
    return response;
  },
  getActivityTrend: async (days = 7) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`/admin/statistics/daily?startDate=${startDate}&endDate=${endDate}`);
    return response;
  },
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/admin/statistics/realtime`);
    return response;
  },
  uploadBatchResult: async (batchOutput: string, date?: string) => {
    return Promise.resolve({ data: { message: 'Not implemented' } });
  }
};

// Daily Report 인터페이스 정의
interface DailyReportResponse {
  reportDate: string;
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    unusedPoints: number;
    inviteUsers: number;
    ticketEarned: number;
    ticketUsed: number;
    ticketExpired: number;
    pointEarned: number;
    pointUsed: number;
    pointExpiredToday: number;
    totalPointExpired: number;
  };
  userStats: {
    prevTotalUsers: number;
    newUsers: number;
    withdrawnUsers: number;
    incompleteUsers: number;
    totalUsers: number;
  };
  ticketStats: {
    issueCount: number;
    issueTotal: number;
    issueBySource: Array<{
      sourceType: string;
      description: string;
      count: number;
      total: number;
    }>;
    bronzeUsageCount: number;
    bronzeUsageTickets: number;
    silverUsageCount: number;
    silverUsageTickets: number;
  };
  pointStats: {
    issueCount: number;
    issueTotal: number;
    boxCount: number;
    drawCount: number;
    boxPoints: number;
    drawPoints: number;
    issueBySource: Array<{
      sourceType: string;
      description: string;
      count: number;
      total: number;
    }>;
    drawUsageCount: number;
    drawUsagePoints: number;
    mallUsageCount: number;
    mallUsagePoints: number;
  };
  boxStats: {
    bronzeWinnings: Array<{
      type: string;
      count: number;
      points: number;
    }>;
    silverWinnings: Array<{
      type: string;
      count: number;
      points: number;
    }>;
    detailedWinnings?: Array<{
      boxType: string;
      prizeName: string;
      count: number;
      points: number;
      setProbability: number;
      actualProbability: number;
    }>;
  };
  drawStats: {
    participation: Array<{
      drawName: string;
      count: number;
      points: number;
    }>;
    winnings: Array<{
      drawType: string;
      prizeName: string;
      count: number;
      points: number;
    }>;
  };
  pointMallStats: {
    gifticonCount: number;
    gifticonPoints: number;
    physicalCount: number;
    physicalPoints: number;
  };
  timeMissionStats: {
    data: Array<{
      sessionDisplayName?: string; // 미션명 - 액션명
      missionName: string;
      sessionDate?: string;
      sessionId?: number;
      selectedActions: string; // 액션명 (단일)
      participantCount: number;
      participationCount: number;
      ticketsEarned: number;
      successRate?: number;
    }>;
    hasData: boolean;
  };
}

// Daily Report 서비스
export const reportService = {
  getDailyReport: async (date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get<DailyReportResponse>('/admin/reports/daily', { params });
    return response.data;
  },
  getTodayReport: async () => {
    const response = await api.get<DailyReportResponse>('/admin/reports/daily/today');
    return response.data;
  },
  getYesterdayReport: async () => {
    const response = await api.get<DailyReportResponse>('/admin/reports/daily/yesterday');
    return response.data;
  },
  
  /**
   * CSV 다운로드
   */
  downloadDailyReportCsv: async (date?: string) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/admin/reports/daily/csv', { 
        params,
        responseType: 'blob', // 바이너리 데이터로 받기
        headers: {
          'Accept': 'text/csv'
        }
      });
      
      // Blob을 파일로 다운로드
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 파일명 생성
      const filename = date ? 
        `daily_report_${date}.csv` : 
        `daily_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      console.error('CSV 다운로드 실패:', error);
      throw error;
    }
  },
};

// 쿠팡 파트너스 설정 인터페이스
interface CoupangPartnersConfig {
  id?: number;
  configName: string;
  linkUrl: string;
  startTime?: string;
  endTime?: string;
  activeDays: string;
  isActive: boolean;
  priority: number;
  message: string;
}

// 쿠팡 파트너스 관리 서비스
export const coupangPartnersService = {
  getAllConfigs: async () => {
    const response = await api.get<CoupangPartnersConfig[]>('/admin/coupang-partners-config');
    return response.data;
  },
  getCurrentConfig: async () => {
    const response = await api.get<CoupangPartnersConfig>('/admin/coupang-partners-config/current');
    return response.data;
  },
  createConfig: async (data: Omit<CoupangPartnersConfig, 'id'>) => {
    const response = await api.post<CoupangPartnersConfig>('/admin/coupang-partners-config', data);
    return response.data;
  },
  updateConfig: async (id: number, data: CoupangPartnersConfig) => {
    const response = await api.put<CoupangPartnersConfig>(`/admin/coupang-partners-config/${id}`, data);
    return response.data;
  },
  deleteConfig: async (id: number) => {
    const response = await api.delete(`/admin/coupang-partners-config/${id}`);
    return response.data;
  },
  toggleConfig: async (id: number, isActive: boolean) => {
    const response = await api.patch(`/admin/coupang-partners-config/${id}/toggle`, { isActive });
    return response.data;
  }
};

// 관리자 지급 내역 인터페이스
interface AdminIssueHistoryResponse {
  issueId: number;
  userId: number;
  userName: string;
  issueType: 'TICKET' | 'POINT';
  amount: number;
  description: string;
  adminName: string;
  adminId: string;
  issuedAt: string;
  status: string;
}

// 관리자 지급 요청 인터페이스
interface AdminIssueRequest {
  userId: number;
  amount: number;
  description: string;
}

// 관리자 티켓/포인트 지급 서비스
export const adminIssueService = {
  issueTickets: async (data: AdminIssueRequest) => {
    const response = await api.post('/admin/lotteries/issue', data);
    return response.data;
  },
  issuePoints: async (data: AdminIssueRequest) => {
    const response = await api.post('/admin/points/issue', data);
    return response.data;
  },
  getUserTicketHistory: async (userId: number, params = {}) => {
    const response = await api.get<{content: AdminIssueHistoryResponse[]}>(`/admin/lotteries/issue-history/user/${userId}`, { params });
    return response.data;
  },
  getUserPointHistory: async (userId: number, params = {}) => {
    const response = await api.get<{content: AdminIssueHistoryResponse[]}>(`/admin/points/issue-history/user/${userId}`, { params });
    return response.data;
  },
  getAllTicketHistory: async (params = {}) => {
    const response = await api.get<{content: AdminIssueHistoryResponse[]}>('/admin/lotteries/issue-history', { params });
    return response.data;
  },
  getAllPointHistory: async (params = {}) => {
    const response = await api.get<{content: AdminIssueHistoryResponse[]}>('/admin/points/issue-history', { params });
    return response.data;
  },
  getUserAllIssueHistory: async (userId: number, params = {}) => {
    try {
      const [ticketResponse, pointResponse] = await Promise.all([
        adminIssueService.getUserTicketHistory(userId, params),
        adminIssueService.getUserPointHistory(userId, params)
      ]);

      const allHistory = [
        ...ticketResponse.content,
        ...pointResponse.content
      ].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

      return {
        content: allHistory,
        totalElements: allHistory.length
      };
    } catch (error) {
      return { content: [], totalElements: 0 };
    }
  }
};
