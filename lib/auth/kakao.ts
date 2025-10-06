// 카카오 로그인 관련 유틸리티 함수
import { mockKakaoLogin } from "./mock-auth";
import { api } from "../../services/api";
import { getEnv, debugEnvironment } from "../utils/env";

// 테스트 모드 설정
const TEST_MODE = false; // 실제 백엔드 연동으로 변경

// 환경별 기본 redirect URI 설정 (환경변수 우선)
const getDefaultRedirectUri = () => {
  // 1. 런타임 환경변수 최우선 (SSM 파라미터에서 설정됨)
  const envRedirectUri = getEnv('NEXT_PUBLIC_KAKAO_REDIRECT_URI');
  if (envRedirectUri) {
    console.log('🔧 Using runtime redirect URI from SSM:', envRedirectUri);
    return envRedirectUri;
  }
  
  // 2. 브라우저 환경에서 현재 도메인 기반 동적 생성
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const callbackPath = '/auth/kakao/callback';
    
    // 개발 환경 도메인 체크
    if (currentOrigin.includes('reward-platformdev-admin.example.com')) {
      const devUri = `${currentOrigin}${callbackPath}`;
      console.log('🔧 Using development domain redirect URI:', devUri);
      return devUri;
    }
    
    // 프로덕션 ALB 주소 체크
    if (currentOrigin.includes('reward-platform-') && currentOrigin.includes('.elb.amazonaws.com')) {
      const prodUri = 'https://admin.reward-platform.kr/auth/kakao/callback';
      console.log('🔧 Using production redirect URI for ALB:', prodUri);
      return prodUri;
    }
    
    // 프로덕션 환경 도메인 체크
    if (currentOrigin.includes('admin.reward-platform.kr')) {
      const prodUri = `${currentOrigin}${callbackPath}`;
      console.log('🔧 Using production domain redirect URI:', prodUri);
      return prodUri;
    }
    
    // 로컬 개발 환경
    if (currentOrigin.includes('localhost')) {
      const localUri = `${currentOrigin}${callbackPath}`;
      console.log('🔧 Using local development redirect URI:', localUri);
      return localUri;
    }
    
    // 기타 환경 (동적 생성)
    const dynamicUri = `${currentOrigin}${callbackPath}`;
    console.log('🔧 Using dynamic redirect URI:', dynamicUri);
    return dynamicUri;
  }
  
  // 3. 기본값 (서버사이드 렌더링)
  console.log('🔧 Using fallback redirect URI');
  return 'https://admin.reward-platform.kr/auth/kakao/callback';
};

// 카카오 로그인 URL 생성
export const getKakaoAuthUrl = () => {
  // 런타임 환경변수 사용
  const kakaoClientId = getEnv('NEXT_PUBLIC_KAKAO_CLIENT_ID');
  
  // 환경변수보다 동적 생성을 우선시 -> SSM 파라미터 우선으로 변경
  const redirectUri = getDefaultRedirectUri();
  
  // 환경변수 디버그 정보 출력
  debugEnvironment();
  
  console.log('🔍 Debug Kakao Auth:', {
    clientId: kakaoClientId ? (kakaoClientId.length > 10 ? 'exists' : 'missing') : 'missing',
    clientIdLength: kakaoClientId?.length || 0,
    clientIdPreview: kakaoClientId ? kakaoClientId.substring(0, 8) + '...' : 'none',
    redirectUri,
    envRedirectUri: getEnv('NEXT_PUBLIC_KAKAO_REDIRECT_URI'),
    origin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
    nodeEnv: getEnv('NODE_ENV'),
    href: typeof window !== 'undefined' ? window.location.href : 'server-side',
    hasRuntimeEnv: typeof window !== 'undefined' && !!window.__ENV__
  });
  
  if (!kakaoClientId || kakaoClientId.length < 10) {
    console.error('카카오 로그인 환경변수가 설정되지 않았습니다.');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('KAKAO')));
    return '';
  }

  // 중복 호출 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code&state=${timestamp}`;
  
  console.log('🚀 Generated Kakao Auth URL:', kakaoAuthUrl);
  
  return kakaoAuthUrl;
};

// 진행 중인 교환 요청을 추적
const pendingExchanges = new Map();

// 인증 코드로 토큰 교환
export const exchangeKakaoCodeForToken = async (code: string) => {
  // 테스트 모드에서는 모의 응답 반환
  if (TEST_MODE) {
    return await mockKakaoLogin();
  }
  
  // 이미 진행 중인 동일한 코드에 대한 요청이 있다면 재사용
  if (pendingExchanges.has(code)) {
    console.log('이미 진행 중인 카카오 인증 코드 교환 요청:', code);
    return pendingExchanges.get(code);
  }
  
  try {
    // 백엔드 API 엔드포인트에 맞게 수정
    const redirectUri = getDefaultRedirectUri();
    
    // 요청 생성 및 맵에 저장 (services/api.ts 사용)
    const exchangePromise = api.post('/auth/login/kakao', {
      authorizationCode: code,
      redirectUri: redirectUri,
      deviceInfo: {
        deviceType: 'WEB', // 웹 환경
        pushToken: '',     // 웹에서는 비어있음
        deviceModel: navigator.userAgent,
        osVersion: navigator.platform,
        appVersion: '1.0.0' // 웹 버전
      }
    }).then((response) => {
      // 요청 완료 후 맵에서 제거
      pendingExchanges.delete(code);
      
      const responseData = response.data;
      console.log('카카오 로그인 응답:', responseData);
      
      // 토큰 저장
      if (responseData.tokens && responseData.tokens.accessToken) {
        localStorage.setItem('token', responseData.tokens.accessToken);
        
        // 리프레시 토큰이 있으면 저장
        if (responseData.tokens.refreshToken) {
          localStorage.setItem('refreshToken', responseData.tokens.refreshToken);
        }
      }
      
      return responseData;
    }).catch(error => {
      // 오류 발생 시 맵에서 제거
      pendingExchanges.delete(code);
      console.error('카카오 로그인 오류:', error);
      throw error;
    });
    
    // 맵에 현재 요청 저장
    pendingExchanges.set(code, exchangePromise);
    
    return exchangePromise;
  } catch (error: unknown) {
    // 모든 오류에 대해 맵에서 제거 확실히
    pendingExchanges.delete(code);
    console.error('카카오 로그인 오류:', error);
    throw error;
  }
};
