import { api } from './api';

// 랜덤박스 관련 인터페이스
interface RandomBoxPointRangeRequest {
  boxType: string;
  pointAMin: number;
  pointAMax: number;
  pointBMin: number;
  pointBMax: number;
  pointCMin: number;
  pointCMax: number;
}

interface RandomBoxPointRangeSingleRequest {
  pointType: string;
  minValue: number;
  maxValue: number;
}

interface RandomBoxPointRangeResponse {
  boxId: number;
  boxName: string;
  boxType: string;
  pointRanges: Array<{
    prizeId: number;
    prizeName: string;
    prizeType: string;
    minPointValue: number;
    maxPointValue: number;
    winningProbability: number;
    remainingCount: number;
  }>;
}

interface Prize {
  id: number;
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  imageUrl: string;
  detailImageUrls?: string[];  // 🆕 디테일 이미지 URL 배열 추가
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreatePrizeRequest {
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  imageUrl: string;
  detailImageUrls?: string[];  // 🆕 디테일 이미지 URL 배열 추가
  description?: string;
  isActive: boolean;
}

// 랜덤박스 관리 서비스
export const randomBoxService = {
  // 랜덤박스 목록 조회
  getRandomBoxes: async (params = {}) => {
    const response = await api.get('/admin/random-boxes', { params });
    return response.data;
  },
  
  // 특정 랜덤박스 조회
  getRandomBox: async (id: number) => {
    const response = await api.get(`/admin/random-boxes/${id}`);
    return response.data;
  },
  
  // 랜덤박스 생성
  createRandomBox: async (data: any) => {
    const response = await api.post('/admin/random-boxes', data);
    return response.data;
  },
  
  // 랜덤박스 수정
  updateRandomBox: async (id: number, data: any) => {
    const response = await api.put(`/admin/random-boxes/${id}`, data);
    return response.data;
  },
  
  // 랜덤박스 삭제
  deleteRandomBox: async (id: number) => {
    const response = await api.delete(`/admin/random-boxes/${id}`);
    return response.data;
  },
  
  // 랜덤박스 활성화/비활성화
  toggleRandomBoxStatus: async (id: number, isActive: boolean) => {
    const response = await api.patch(`/admin/random-boxes/${id}/toggle-status`, { isActive });
    return response.data;
  },
  
  // 기본포인트 범위 조회
  getPointRanges: async (boxId: number) => {
    const response = await api.get<RandomBoxPointRangeResponse>(`/admin/randombox/point-range/${boxId}`);
    return response.data;
  },
  
  // 기본포인트 범위 일괄 설정
  updatePointRangesBulk: async (boxId: number, data: RandomBoxPointRangeRequest) => {
    const response = await api.put<RandomBoxPointRangeResponse>(`/admin/randombox/point-range/${boxId}/bulk`, data);
    return response.data;
  },
  
  // 기본포인트 범위 개별 설정
  updatePointRangeSingle: async (boxId: number, data: RandomBoxPointRangeSingleRequest) => {
    const response = await api.put<RandomBoxPointRangeResponse>(`/admin/randombox/point-range/${boxId}/single`, data);
    return response.data;
  },
  
  // 기본포인트 범위 초기화
  resetPointRanges: async (boxId: number) => {
    const response = await api.post<RandomBoxPointRangeResponse>(`/admin/randombox/point-range/${boxId}/reset`);
    return response.data;
  },
  
  // 랜덤박스 상품 목록 조회
  getRandomBoxPrizes: async (boxId: number) => {
    const response = await api.get(`/admin/random-boxes/${boxId}/prizes`);
    return response.data;
  },
  
  // 랜덤박스에 상품 추가
  addPrizeToRandomBox: async (boxId: number, prizeId: number, prizeData: any) => {
    const response = await api.post(`/admin/random-boxes/${boxId}/prizes/${prizeId}`, prizeData);
    return response.data;
  },
  
  // 랜덤박스 상품 설정 수정
  updateRandomBoxPrize: async (boxId: number, prizeId: number, prizeData: any) => {
    const response = await api.put(`/admin/random-boxes/${boxId}/prizes/${prizeId}`, prizeData);
    return response.data;
  },
  
  // 랜덤박스에서 상품 제거
  removePrizeFromRandomBox: async (boxId: number, prizeId: number) => {
    const response = await api.delete(`/admin/random-boxes/${boxId}/prizes/${prizeId}`);
    return response.data;
  }
};

// 상품 관리 서비스
export const prizeService = {
  // 상품 목록 조회
  getPrizes: async (params = {}) => {
    const response = await api.get<{content: Prize[], totalElements: number, totalPages: number}>('/admin/prizes', { params });
    return response.data;
  },
  
  // 특정 상품 조회
  getPrize: async (id: number) => {
    const response = await api.get<Prize>(`/admin/prizes/${id}`);
    return response.data;
  },
  
  // 특정 상품 조회 (별칭)
  getPrizeById: async (id: number) => {
    const response = await api.get(`/admin/prizes/${id}`);
    return response.data;
  },
  
  // 상품 생성
  createPrize: async (data: CreatePrizeRequest) => {
    const response = await api.post<Prize>('/admin/prizes', data);
    return response.data;
  },
  
  // 상품 수정
  updatePrize: async (id: number, data: Partial<CreatePrizeRequest>) => {
    const response = await api.put<Prize>(`/admin/prizes/${id}`, data);
    return response.data;
  },
  
  // 상품 삭제
  deletePrize: async (id: number) => {
    const response = await api.delete(`/admin/prizes/${id}`);
    return response.data;
  },
  
  // 상품 활성화/비활성화
  togglePrizeStatus: async (id: number, isActive: boolean) => {
    const response = await api.patch(`/admin/prizes/${id}/toggle-status`, { isActive });
    return response.data;
  },
  
  // 상품 이미지 업로드
  uploadPrizeImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/prizes/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};