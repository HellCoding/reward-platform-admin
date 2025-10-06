"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithKakao } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isProcessed = false;

    const handleKakaoCallback = async () => {
      if (isProcessed) return;
      isProcessed = true;

      try {
        // 이미 로그인된 상태인지 확인
        const currentToken = localStorage.getItem("token");
        const currentUserData = sessionStorage.getItem("userData");
        
        if (currentToken && currentUserData) {
          router.push("/reports");
          return;
        }

        // 인증 코드 가져오기
        const code = searchParams.get("code");
        
        if (!code) {
          router.push("/login");
          return;
        }

        // 중복 처리 방지
        const processedCode = sessionStorage.getItem("processedKakaoCode");
        if (processedCode === code) {
          router.push("/reports");
          return;
        }

        // 코드 처리 기록
        sessionStorage.setItem("processedKakaoCode", code);

        // URL 정리
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        window.history.replaceState({}, document.title, url.pathname);

        // 카카오 로그인 처리
        await loginWithKakao(code);

        // 성공 시 대시보드로 이동
        router.push("/reports");

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "카카오 로그인 처리 중 오류가 발생했습니다.";
        
        // KOE320 에러 (중복 코드) 처리
        if (errorMessage.includes("KOE320") || errorMessage.includes("authorization code not found")) {
          // 리프레시 토큰 확인
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            router.push("/reports");
            return;
          }
        }
        
        setError(errorMessage);
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, loginWithKakao, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">카카오 로그인 처리</h1>
        </div>
        
        {loading && !error && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-center text-gray-600 dark:text-gray-400">
              카카오 로그인을 처리하는 중입니다...
            </p>
          </div>
        )}
        
        {error && !loading && (
          <div className="text-center space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400">로그인 오류</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="text-center">
            <div className="text-green-600 dark:text-green-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="font-medium">로그인 성공!</p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              대시보드로 이동 중...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">카카오 로그인 처리 중</h1>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            로딩 중...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KakaoCallbackContent />
    </Suspense>
  );
}
