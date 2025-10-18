import axios from 'axios';
import { authService } from './api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 요청에 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// DrawPrizeSimpleDTO 타입 추가
export interface DrawPrizeSimpleDTO {
  id: number;
  prizeId: number;
  prizeName: string;
  prizeBrand: string;
  prizeType: string;
  winningProbability: number;
  remainingCount: number;
  totalWinningCount: number;
  winningPeriodDays: number;
}

// DrawPrize 타입 정의
export interface DrawPrize {
  id: number;
  drawId: number;
  drawName: string;
  prizeId: number;
  prizeName: string;
  prizeBrand: string;
  prizeType: string;
  winningPeriodDays: number;
  totalWinningCount: number;
  remainingCount: number;
  winningProbability: number; // 백엔드에서는 직접 퍼센트 값으로 저장됨 (39 = 39%, 0.5 = 0.5%)
  displayProbability: string;
  winningStartDate: string;
  socialProofEnabled: boolean;
  pushEnabled: boolean;
  state: number;
}

// Draw 타입 정의 - 백엔드 API에 맞게 수정
export interface Draw {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  drawType: string;
  imageUrl: string;
  isActive: boolean;
  reentryRestrictionDays?: number;
  prizes?: DrawPrizeSimpleDTO[];
}

// 업데이트 요청 타입 정의
export interface DrawPrizeUpdateRequest {
  winningProbability?: number;
  displayProbability?: string;
  winningPeriodDays?: number;
  totalWinningCount?: number;
  socialProofEnabled?: boolean;
  pushEnabled?: boolean;
}

// 업데이트 결과 타입 정의
export interface UpdateResult {
  id: number;
  message: string;
  success: boolean;
}

// 확률 일괄 업데이트 요청 인터페이스
export interface ProbabilityUpdateRequest {
  id: number;
  winningProbability: number; // 백엔드에서는 직접 퍼센트 값으로 저장됨 (39 = 39%)
}

// 확률 합계 응답 인터페이스
export interface ProbabilitySumResponse {
  drawId: number;
  totalProbability: string; // 백엔드에서는 "39.50%" 형식으로 반환함
  isValid: boolean;
}

// 뽑기 서비스
export const drawService = {
  // 모든 뽑기 목록 조회
  getAllDraws: async (): Promise<Draw[]> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draws -> /admin/draws
      const response = await api.get('/admin/draws');
      console.log('getAllDraws 응답:', response.data);
      
      // 응답 구조 확인 및 데이터 처리
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // 응답이 객체인 경우, data 속성이 있는지 확인
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        // 객체의 값들이 배열인지 확인
        const values = Object.values(response.data);
        if (values.length > 0 && Array.isArray(values[0])) {
          return values[0] as Draw[];
        }
      }
      
      // 기본값으로 빈 배열 반환
      console.warn('getAllDraws: 예상치 못한 응답 형식, 빈 배열을 반환합니다.', response.data);
      return [];
    } catch (error) {
      console.error('getAllDraws 오류:', error);
      return []; // 오류 발생 시 빈 배열 반환
    }
  },

  // 특정 뽑기의 상품 목록 조회
  getPrizesByDrawId: async (drawId: number): Promise<DrawPrize[]> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draw/{drawId}/prizes -> /admin/draws/draw/{drawId}/prizes
      const response = await api.get(`/admin/draws/draw/${drawId}/prizes`);
      console.log('getPrizesByDrawId 응답:', response.data);
      
      // 응답 구조 확인 및 데이터 처리
      if (Array.isArray(response.data)) {
        // 백엔드에서 확률이 이미 퍼센트 단위로 저장되어 있으므로 그대로 사용
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // 응답이 객체인 경우, data 속성이 있는지 확인
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      // 기본값으로 빈 배열 반환
      console.warn('getPrizesByDrawId: 예상치 못한 응답 형식, 빈 배열을 반환합니다.', response.data);
      return [];
    } catch (error) {
      console.error('getPrizesByDrawId 오류:', error);
      return []; // 오류 발생 시 빈 배열 반환
    }
  },

  // 개별 뽑기 상품 조회
  getDrawPrize: async (id: number): Promise<DrawPrize> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draw-prize/{id} -> /admin/draws/draw-prize/{id}
      const response = await api.get(`/admin/draws/draw-prize/${id}`);
      console.log('getDrawPrize 응답:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        let prizeData;
        
        // data 속성이 있는지 확인
        if (response.data.data) {
          prizeData = response.data.data;
        } else {
          // 직접 반환된 객체인 경우
          prizeData = response.data;
        }
        
        // 백엔드에서 확률이 이미 퍼센트 단위로 저장되어 있으므로 그대로 사용
        return prizeData;
      }
      
      throw new Error('유효하지 않은 상품 데이터');
    } catch (error) {
      console.error('getDrawPrize 오류:', error);
      throw error;
    }
  },

  // 뽑기 상품 업데이트
  updateDrawPrize: async (id: number, data: DrawPrizeUpdateRequest): Promise<UpdateResult> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draw-prize/{id} -> /admin/draws/draw-prize/{id}
      const response = await api.put(`/admin/draws/draw-prize/${id}`, data);
      console.log('updateDrawPrize 응답:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        // data 속성이 있는지 확인
        if (response.data.data) {
          return response.data.data;
        }
        // 직접 반환된 객체인 경우
        return response.data;
      }
      
      return {
        id,
        success: true,
        message: '업데이트 완료'
      };
    } catch (error) {
      console.error('updateDrawPrize 오류:', error);
      throw error;
    }
  },

  // 뽑기 확률 합계 조회
  getProbabilitySum: async (drawId: number): Promise<ProbabilitySumResponse> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draw/{drawId}/probability-sum -> /admin/draws/draw/{drawId}/probability-sum
      const response = await api.get(`/admin/draws/draw/${drawId}/probability-sum`);
      console.log('getProbabilitySum 원본 응답:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        let totalProbability = response.data.totalProbability;
        let isValid = response.data.isValid;
        
        // 백엔드에서 "10000.00%" 형태로 반환된 경우 수정
        if (totalProbability && typeof totalProbability === 'string') {
          // 숫자 부분만 추출하여 100으로 나누어 올바른 백분율로 변환
          const numericPart = parseFloat(totalProbability.replace('%', ''));
          if (!isNaN(numericPart) && numericPart > 1000) { // 1000 이상이면 100으로 나누어 보정
            totalProbability = (numericPart / 100).toFixed(2) + '%';
            console.log('확률 합계 보정:', response.data.totalProbability, '->', totalProbability);
            
            // 보정 후 100% (소수점 포함 100.00%)인 경우 isValid��� true로 설정
            if (Math.abs(numericPart / 100 - 100) < 0.01) {
              isValid = true;
              console.log('확률 합계가 100%여서 isValid를 true로 변경');
            }
          }
        }
        
        return {
          drawId: response.data.drawId,
          totalProbability: totalProbability,
          isValid: isValid
        };
      }
      
      throw new Error('유효하지 않은 확률 합계 데이터');
    } catch (error) {
      console.error('getProbabilitySum 오류:', error);
      throw error;
    }
  },

  // 뽑기 확률 일괄 업데이트
  updateProbabilities: async (drawId: number, probabilities: ProbabilityUpdateRequest[]): Promise<any> => {
    try {
      // 엔드포인트 변경: /admin/prizes/draw/{drawId}/probabilities -> /admin/draws/draw/{drawId}/probabilities
      const response = await api.put(`/admin/draws/draw/${drawId}/probabilities`, probabilities);
      console.log('updateProbabilities 응답:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('updateProbabilities 오류:', error);
      throw error;
    }
  }
};