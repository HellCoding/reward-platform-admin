/**
 * 런타임 환경변수 접근 유틸리티
 * 빌드타임과 런타임 환경변수를 통합 관리
 */

interface RuntimeEnvironment {
  API_BASE_URL: string;
  NEXT_PUBLIC_API_URL: string;
  NEXTAUTH_URL: string;
  NEXT_PUBLIC_KAKAO_CLIENT_ID: string;
  NEXT_PUBLIC_KAKAO_REDIRECT_URI: string;
  NODE_ENV: string;
  ENVIRONMENT: string;
  READ_ONLY_MODE?: string;
}

// 런타임 환경변수 타입 확장
declare global {
  interface Window {
    __ENV__: RuntimeEnvironment;
  }
}

/**
 * 환경변수 가져오기 (런타임 우선)
 * 1. window.__ENV__ (런타임 주입)
 * 2. process.env (빌드타임)
 * 3. 환경별 기본값
 */
export const getEnv = (key: keyof RuntimeEnvironment): string => {
  // 브라우저 환경에서 런타임 환경변수 우선 사용
  if (typeof window !== 'undefined' && window.__ENV__) {
    const value = window.__ENV__[key];
    if (value) return value;
  }

  // 빌드타임 환경변수 폴백
  const buildTimeValue = process.env[key];
  if (buildTimeValue) return buildTimeValue;

  // 환경별 기본값 설정
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  const defaults: RuntimeEnvironment = {
    API_BASE_URL: isProduction ? '' : 'http://localhost:8080',
    NEXT_PUBLIC_API_URL: isProduction ? '' : 'http://localhost:8080/api',
    NEXTAUTH_URL: isProduction ? '' : 'http://localhost:3000',
    NEXT_PUBLIC_KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
    NEXT_PUBLIC_KAKAO_REDIRECT_URI: isProduction
      ? ''
      : 'http://localhost:3000/auth/kakao/callback',
    NODE_ENV: environment,
    ENVIRONMENT: isProduction ? 'prod' : 'local',
    READ_ONLY_MODE: isProduction ? 'true' : 'false'
  };

  return defaults[key] || '';
};

/**
 * 환경별 설정 가져오기
 */
export const getEnvironmentConfig = () => {
  const environment = getEnv('ENVIRONMENT');

  const configs = {
    local: {
      apiBaseUrl: 'http://localhost:8080',
      adminBaseUrl: 'http://localhost:3000',
      kakaoClientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
    },
    dev: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
      adminBaseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      kakaoClientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
    },
    prod: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',
      adminBaseUrl: process.env.NEXTAUTH_URL || '',
      kakaoClientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
    }
  };

  return configs[environment as keyof typeof configs] || configs.dev;
};

/**
 * 읽기 전용 모드 체크
 */
export const isReadOnlyMode = (): boolean => {
  const readOnlyMode = getEnv('READ_ONLY_MODE');
  return readOnlyMode === 'true';
};

/**
 * 운영 환경 여부 체크
 */
export const isProductionEnvironment = (): boolean => {
  const environment = getEnv('ENVIRONMENT');
  return environment === 'prod' || environment === 'production';
};

/**
 * 수정 작업 허용 여부 체크
 */
export const canPerformWriteOperations = (): boolean => {
  return !isReadOnlyMode();
};

/**
 * 읽기 전용 모드 경고 메시지
 */
export const getReadOnlyModeMessage = (): string => {
  return "현재 읽기 전용 모드입니다. 데이터 조회만 가능하며, 생성/수정/삭제 작업은 제한됩니다.";
};
