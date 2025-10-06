"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  loginWithKakao: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // 처리 중인 카카오 인증 코드를 저장
  const processingKakaoCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      
      // 토큰이 없으면 모든 캐시 데이터 무시하고 로그아웃 상태로 설정
      if (!token) {
        // 캐시된 데이터가 있었다면 정리가 필요함을 알림
        const hadCachedData = sessionStorage.getItem("userData") || sessionStorage.getItem("processedKakaoCode");
        if (hadCachedData) {
          console.log("토큰 없음으로 인한 캐시 데이터 정리");
        }
        // 토큰이 없으면 캐시된 데이터도 정리
        sessionStorage.removeItem("userData");
        sessionStorage.removeItem("processedKakaoCode");
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // 세션 스토리지에서 사용자 정보 가져오기 시도 (토큰이 있는 경우에만)
      const cachedUserData = sessionStorage.getItem("userData");
      
      // 캐시된 사용자 정보가 있으면 사용
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          console.log("캐시된 사용자 정보 사용:", userData);
          
          // 사용자 역할 확인
          const userRole = userData.role || 'USER';
          
          // 관리자(ADMIN, SUPER_ADMIN) 권한인 경우만 로그인 허용
          if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
            setUser(userData);
            setIsLoading(false);
            return;
          } else {
            // 일반 사용자인 경우 로그아웃 처리
            handleNonAdminUser(userData.email || "unknown");
            return;
          }
        } catch (e) {
          console.warn("캐시된 사용자 정보 파싱 실패, API 호출로 전환:", e);
          // 에러 발생하면 캐시 데이터 삭제
          sessionStorage.removeItem("userData");
        }
      }
      
      try {
        // 캐시된 정보가 없거나 파싱 실패 시 API 호출
        const currentUser = await authService.getCurrentUser();
        console.log("API로부터 현재 사용자 정보:", currentUser);
        
        // 사용자 역할 확인
        const userRole = currentUser.role || 'USER';
        
        // 관리자(ADMIN, SUPER_ADMIN) 권한인 경우만 로그인 허용
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
          const userData = {
            ...currentUser,
            role: userRole
          };
          
          setUser(userData);
          
          // 세션 스토리지에 사용자 정보 캐싱
          sessionStorage.setItem("userData", JSON.stringify(userData));
        } else {
          // 일반 사용자인 경우 로그아웃 처리
          handleNonAdminUser(currentUser.email);
        }
      } catch (err: any) {
        console.error("API 호출 에러:", err);
        
        // 401, 403, 500 등 인증/인가 관련 에러인 경우 로그아웃 처리
        if (err.response?.status === 401 || 
            err.response?.status === 403 || 
            err.response?.status === 500 ||
            err.message?.includes('token') || 
            err.message?.includes('Unauthorized') ||
            err.message?.includes('Access Denied')) {
          console.log("토큰 관련 에러 감지, 강제 로그아웃:", err.response?.status, err.message);
          clearAuthData();
          return;
        }
        
        // 네트워크 에러 등의 경우만 캐시된 데이터 사용
        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            // 역할을 다시 한번 확인
            if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
              console.log("네트워크 에러, 캐시된 관리자 정보 사용:", userData);
              setUser(userData);
            } else {
              // 관리자가 아니면 로그아웃
              handleNonAdminUser(userData.email || "unknown");
            }
          } catch (e) {
            // 파싱도 실패하면 로그아웃
            console.error("캐시된 사용자 정보 파싱 실패:", e);
            clearAuthData();
          }
        } else {
          // 캐시된 데이터도 없으면 로그아웃
          clearAuthData();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // 일반 사용자 처리를 위한 헬퍼 함수
    const handleNonAdminUser = (email: string) => {
      console.warn("관리자가 아닌 사용자의 접근:", email);
      setError("관리자 권한이 필요합니다. 일반 사용자는 관리자 페이지에 접근할 수 없습니다.");
      clearAuthData();
      
      // 로그인 페이지로 이동
      if (!window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    };
    
    // 인증 데이터 초기화 헬퍼 함수
    const clearAuthData = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("processedKakaoCode");
      sessionStorage.removeItem("isRedirecting");
      processingKakaoCodeRef.current = null;
      setUser(null);
      setError(null);
      console.log("인증 데이터 완전 클리어됨");
    };
    
    initAuth();
  }, []); // router 의존성 제거

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(username, password);
      console.log("로그인 응답:", response);
      
      // 사용자 정보가 있으면 저장
      if (response.user) {
        setUser(response.user);
        sessionStorage.removeItem("isRedirecting");
        router.push("/reports");
      } else {
        throw new Error("로그인 응답에 사용자 정보가 없습니다.");
      }
    } catch (err: any) {
      console.error("로그인 오류:", err);
      setError(err.response?.data?.message || err.message || "로그인 중 오류가 발생했습니다.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithKakao = async (code: string) => {
    // 이미 처리 중인 동일한 코드인 경우 중복 처리 방지
    if (processingKakaoCodeRef.current === code) {
      console.log('이미 처리 중인 카카오 인증 코드입니다:', code);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    processingKakaoCodeRef.current = code;
    
    try {
      console.log('🔐 카카오 로그인 시작:', code);
      console.log('🔐 로그인 전 토큰 상태:', {
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken')
      });
      
      // 카카오 로그인 API 호출
      const response = await authService.loginWithKakao(code);
      
      console.log('🔐 카카오 로그인 응답 전체:', response);
      console.log('🔐 응답에 포함된 토큰:', response.tokens);
      
      // API 호출 직후 토큰 저장 상태 확인
      console.log('🔐 API 호출 후 토큰 상태:', {
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken')
      });
      
      // 사용자 역할 확인 (services/api.ts에서 이미 검증되었지만 안전장치)
      const userRole = response.role || "USER";
      console.log('🔐 사용자 역할:', userRole);
      
      // 회원 정보 설정
      const userData: User = {
        id: response.email || "",
        username: response.email || "",
        email: response.email || "",
        name: response.name || "관리자",
        role: userRole,
      };
      
      console.log('🔐 생성된 사용자 데이터:', userData);
      
      // services/api.ts에서 이미 관리자 권한을 검증했으므로 바로 로그인 처리
      setUser(userData);
      
      // 세션 스토리지에 사용자 정보 저장
      sessionStorage.setItem("userData", JSON.stringify(userData));
      console.log('🔐 세션 스토리지에 사용자 정보 저장 완료');
      
      // 최종 토큰 상태 확인
      const finalTokenCheck = () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userData = sessionStorage.getItem('userData');
        
        console.log('🔐 최종 토큰 상태 확인:', {
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          hasUserData: !!userData,
          tokenLength: token?.length || 0,
          refreshTokenLength: refreshToken?.length || 0
        });
        
        if (!refreshToken && token) {
          console.error('🔐 ❌ 액세스 토큰은 있지만 리프레시 토큰이 없습니다!');
        }
      };
      
      // 즉시 실행 및 100ms 후 재확인
      finalTokenCheck();
      setTimeout(finalTokenCheck, 100);
      
      sessionStorage.removeItem("isRedirecting");
      router.push("/reports");
      
      // 코드 처리 완료 후 참조 값 초기화
      processingKakaoCodeRef.current = null;
    } catch (err: any) {
      // 오류 메시지 추출 로직 개선
      let errorMessage = "카카오 로그인 중 오류가 발생했습니다.";
      
      // services/api.ts에서 설정된 에러 메시지 우선 사용
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      // 관리자 권한 관련 에러 메시지는 이미 services/api.ts에서 처리됨
      console.error('카카오 로그인 오류:', errorMessage);
      setError(errorMessage);
      
      // 코드 처리 완료 후 참조 값 초기화
      processingKakaoCodeRef.current = null;
      
      // 에러는 캐치하지만 재던지지 않음으로써 라우터 변경을 방지
      // throw new Error(errorMessage); 
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    } finally {
      // 모든 스토리지 및 세션 데이터 완전 클리어
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("processedKakaoCode");
      sessionStorage.removeItem("isRedirecting"); // 리다이렉트 플래그 정리
      
      // 모든 세션 스토리지 클리어하지 말고 필요한 것만 정리
      // sessionStorage.clear(); // 이 부분 제거
      
      // 처리 중인 코드 참조도 초기화
      processingKakaoCodeRef.current = null;
      
      setUser(null);
      setError(null);
      setIsLoading(false);
      
      console.log("로그아웃 완료 - 모든 세션 데이터 클리어됨");
      
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, loginWithKakao, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};