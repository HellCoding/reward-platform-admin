// 모의 인증 함수 (테스트용)
// 실제 백엔드 연동 시 제거하세요

/**
 * 모의 카카오 로그인 처리
 * 백엔드가 준비되지 않은 상태에서 테스트용으로 사용
 */
export const mockKakaoLogin = () => {
  return new Promise((resolve) => {
    // 몇 초간 지연 후 응답 (실제 API 호출 시뮬레이션)
    setTimeout(() => {
      // 모의 응답 데이터
      const mockResponse = {
        token: "mock-kakao-token-" + Math.random().toString(36).substring(2, 15),
        user: {
          id: "kakao-123456789",
          username: "kakao_user",
          name: "카카오 사용자",
          role: "ADMIN"
        }
      };
      
      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('token', mockResponse.token);
      
      resolve(mockResponse);
    }, 1500); // 1.5초 지연
  });
};

/**
 * 모의 애플 로그인 처리
 * 백엔드가 준비되지 않은 상태에서 테스트용으로 사용
 */
export const mockAppleLogin = () => {
  return new Promise((resolve) => {
    // 몇 초간 지연 후 응답 (실제 API 호출 시뮬레이션)
    setTimeout(() => {
      // 모의 응답 데이터
      const mockResponse = {
        token: "mock-apple-token-" + Math.random().toString(36).substring(2, 15),
        user: {
          id: "apple-123456789",
          username: "apple_user",
          name: "애플 사용자",
          role: "ADMIN"
        }
      };
      
      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('token', mockResponse.token);
      
      resolve(mockResponse);
    }, 1500); // 1.5초 지연
  });
};
