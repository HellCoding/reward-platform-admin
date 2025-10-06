"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getKakaoAuthUrl } from "@/lib/auth/kakao";
import { initializeEnvironment } from "@/lib/utils/env";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { error: authError, isLoading, user } = useAuth();
  const [kakaoAuthUrl, setKakaoAuthUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 환경변수 초기화 및 디버그 정보 출력
    initializeEnvironment();
    
    // 카카오 로그인 URL 설정 (한 번만)
    if (!kakaoAuthUrl) {
      setKakaoAuthUrl(getKakaoAuthUrl());
    }
    
    // 토큰 유효성 강제 확인 및 정리
    const checkAndClearExpiredTokens = () => {
      const token = localStorage.getItem("token");
      const userData = sessionStorage.getItem("userData");
      
      // 토큰이나 사용자 데이터가 있다면 유효성 검사
      if (token || userData) {
        console.log("로그인 페이지 접근 시 기존 토큰/데이터 발견, 유효성 검사 중...");
        
        // 브라우저 강력 새로고침 후에도 남아있는 만료된 데이터 강제 정리
        const shouldClearData = () => {
          // 토큰은 있지만 사용자 데이터가 없는 경우
          if (token && !userData) {
            console.log("토큰은 있지만 사용자 데이터 없음 - 데이터 불일치");
            return true;
          }
          
          // 사용자 데이터는 있지만 토큰이 없는 경우
          if (!token && userData) {
            console.log("사용자 데이터는 있지만 토큰 없음 - 데이터 불일치");
            return true;
          }
          
          // 둘 다 있는 경우는 auth-context에서 API 호출로 검증
          return false;
        };
        
        if (shouldClearData()) {
          console.log("데이터 불일치 감지, 강제 정리 실행");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("userData");
          sessionStorage.removeItem("processedKakaoCode");
          sessionStorage.removeItem("kakaoLoginCompleted");
          sessionStorage.removeItem("isRedirecting");
          
          // 페이지 새로고침으로 auth-context 재초기화
          setTimeout(() => {
            window.location.reload();
          }, 100);
          return;
        }
      }
    };
    
    checkAndClearExpiredTokens();
  }, [kakaoAuthUrl]);

  useEffect(() => {
    // 리다이렉트 진행 중이면 중복 실행 방지
    const isRedirecting = sessionStorage.getItem("isRedirecting");
    if (isRedirecting === "true") {
      console.log("이미 리다이렉트 진행 중, 실행 방지");
      return;
    }

    // 로딩 중이면 대기
    if (isLoading) {
      console.log("인증 상태 로딩 중, 대기");
      return;
    }

    // 실제 로그인 상태 확인 (사용자 정보 + 토큰 모두 확인)
    const token = localStorage.getItem("token");
    
    if (user && token) {
      console.log("이미 로그인된 상태, 대시보드로 이동:", user);
      sessionStorage.setItem("isRedirecting", "true");
      // 카카오 관련 임시 플래그들 정리
      sessionStorage.removeItem("kakaoLoginCompleted");
      sessionStorage.removeItem("processedKakaoCode");
      router.push("/reports");
    } else if (user && !token) {
      // 사용자 정보는 있지만 토큰이 없는 경우 - 데이터 불일치, 세션 정리
      console.log("데이터 불일치 감지: 사용자 정보는 있지만 토큰이 없음 - 세션 정리");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("processedKakaoCode");
      sessionStorage.removeItem("kakaoLoginCompleted");
      sessionStorage.removeItem("isRedirecting");
    } else if (!user && !token) {
      // 로그인되지 않은 정상 상태 - 카카오 관련 임시 플래그만 정리
      sessionStorage.removeItem("kakaoLoginCompleted");
      sessionStorage.removeItem("isRedirecting");
      console.log("로그인되지 않은 정상 상태");
    }
  }, [user, isLoading]); // router 의존성 제거, isLoading 추가

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-12 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              RewardPlatform Admin
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              관리자 전용 페이지입니다
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                관리자 권한이 있는 계정만 접근 가능합니다
              </p>
            </div>
          </div>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">로그인 오류</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{authError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <a
            href={kakaoAuthUrl}
            className={`w-full flex items-center justify-center px-6 py-4 bg-[#FEE500] text-[#000000] rounded-xl font-semibold text-base transition-all duration-200 hover:bg-[#E6CF00] hover:shadow-lg transform hover:-translate-y-0.5 ${
              isLoading ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0C22.39 0 0 17.77 0 39.69C0 52.59 8.42 64.25 22.08 70.86C21.19 74.38 18.34 88.14 17.93 93.29C17.93 93.29 17.82 95.86 19.49 96.54C21.23 97.26 23.21 95.84 25.67 93.89C27.31 92.58 35.53 86.73 39.12 84.21C43.29 84.92 47.59 85.3 50 85.3C77.61 85.3 100 67.53 100 45.61C100 23.69 77.61 0 50 0Z" fill="black"/>
                <path d="M37.7508 53.8397C37.7508 53.8397 37.3608 53.8197 36.8108 53.1897C36.2608 52.5597 30.8308 45.2997 30.8308 45.2997C30.8308 45.2997 30.0408 44.2297 31.1108 43.5197C32.1808 42.8097 33.2508 43.2997 33.5608 43.5597C33.8708 43.8197 39.0608 49.9397 39.0608 49.9397L37.7508 53.8397Z" fill="#FEE500"/>
                <path d="M69.1691 53.8397C69.1691 53.8397 69.5591 53.8197 70.1091 53.1897C70.6591 52.5597 76.0891 45.2997 76.0891 45.2997C76.0891 45.2997 76.8791 44.2297 75.8091 43.5197C74.7391 42.8097 73.6691 43.2997 73.3591 43.5597C73.0491 43.8197 67.8591 49.9397 67.8591 49.9397L69.1691 53.8397Z" fill="#FEE500"/>
                <path d="M29.3999 33.3904C29.3999 31.7104 30.7699 30.3604 32.4299 30.3604H37.7599C39.4199 30.3604 40.7899 31.7304 40.7899 33.3904V45.6304C40.7899 47.3104 39.4199 48.6604 37.7599 48.6604H32.4299C30.7699 48.6604 29.3999 47.2904 29.3999 45.6304V33.3904Z" fill="#FEE500"/>
                <path d="M43.2305 33.3904C43.2305 31.7104 44.6006 30.3604 46.2606 30.3604H51.5906C53.2506 30.3604 54.6205 31.7304 54.6205 33.3904V45.6304C54.6205 47.3104 53.2506 48.6604 51.5906 48.6604H46.2606C44.6006 48.6604 43.2305 47.2904 43.2305 45.6304V33.3904Z" fill="#FEE500"/>
                <path d="M59.2695 33.3904C59.2695 31.7104 60.6395 30.3604 62.2995 30.3604H67.6295C69.2895 30.3604 70.6595 31.7304 70.6595 33.3904V45.6304C70.6595 47.3104 69.2895 48.6604 67.6295 48.6604H62.2995C60.6395 48.6604 59.2695 47.2904 59.2695 45.6304V33.3904Z" fill="#FEE500"/>
              </svg>
              <span>{isLoading ? "로그인 처리 중..." : "카카오로 로그인"}</span>
            </div>
          </a>
          
          {/*<p className="text-center text-sm text-gray-500 dark:text-gray-400">*/}
          {/*  카카오 계정으로 안전하게 로그인하세요*/}
          {/*</p>*/}
        </div>

        {/*<div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">*/}
        {/*  <p className="text-xs text-gray-400 dark:text-gray-500">*/}
        {/*    © 2025 RewardPlatform Admin. All rights reserved.*/}
        {/*  </p>*/}
        {/*</div>*/}
      </div>
    </div>
  );
}