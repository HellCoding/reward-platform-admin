import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // API 요청인 경우만 처리
  if (request.nextUrl.pathname.startsWith('/api')) {
    // 환경별 API 서버 URL 결정
    let targetBaseUrl: string;
    
    // 개발 환경 체크
    if (process.env.NODE_ENV === 'development') {
      targetBaseUrl = 'http://localhost:8080';
    } else {
      // 운영 환경에서는 환경변수 또는 기본값 사용
      // 환경변수 우선순위: API_BASE_URL > NEXT_PUBLIC_API_URL
      const apiUrlFromEnv = process.env.API_BASE_URL || 
                           process.env.NEXT_PUBLIC_API_URL ||
                           'https://reward-platformdevs-api.example.com/api';
      
      // 환경변수에 이미 '/api'가 포함되어 있는지 확인
      if (apiUrlFromEnv.endsWith('/api')) {
        // '/api'가 이미 포함되어 있으면 그대로 사용하되 마지막 '/api' 제거
        targetBaseUrl = apiUrlFromEnv.slice(0, -4);
      } else {
        targetBaseUrl = apiUrlFromEnv;
      }
    }
    
    // API 경로 재작성 - 요청된 경로를 그대로 추가
    const apiPath = request.nextUrl.pathname;
    const targetUrl = `${targetBaseUrl}${apiPath}${request.nextUrl.search}`;
    
    console.log(`🔄 API Proxy: ${request.nextUrl.pathname} → ${targetUrl}`);
    console.log(`🔧 Base URL: ${targetBaseUrl} (from env: ${process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL})`);
    
    // 새로운 URL로 리다이렉트
    return NextResponse.rewrite(new URL(targetUrl));
  }
  
  // API가 아닌 요청은 그대로 통과
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
