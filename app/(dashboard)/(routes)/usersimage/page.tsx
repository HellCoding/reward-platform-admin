'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserMinus, 
  Search,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { userService } from '@/services/api';

interface UserWithImage {
  userId: number;
  name: string;
  phoneNumber: string;
  email: string;
  loginProvider: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DORMANT' | 'WITHDRAWN';
  registeredAt: string;
  lastAccessDate: string;
  gender: 'M' | 'F' | '';
  profileImageUrl?: string;
}

interface FilterState {
  status: string;
  loginProvider: string;
  gender: string;
  searchKeyword: string;
  hasImage: string; // 이미지 보유 여부 필터: '', 'YES', 'NO', 'DEFAULT'
}

// 🆕 기본 이미지 URL 패턴 감지 함수
const isDefaultProfileImage = (imageUrl?: string): boolean => {
  if (!imageUrl) return false;
  
  const defaultImagePatterns = [
    // 카카오 기본 프로필 이미지
    'default_profile.jpeg',
    'default_profile.jpg',
    'default_profile.png',
    '/account_images/default_profile',
    
    // 로컬 기본 이미지
    '/images/default-profile.png',
    '/images/default-profile.jpg',
    '/images/default-profile.jpeg',
    
    // 다른 기본 이미지 패턴들
    'default-avatar',
    'placeholder-avatar',
    'default_avatar'
  ];
  
  return defaultImagePatterns.some(pattern => imageUrl.includes(pattern));
};

// 🆕 이미지 타입 분류 함수
const getImageType = (imageUrl?: string): 'NONE' | 'DEFAULT' | 'CUSTOM' => {
  if (!imageUrl || imageUrl.trim() === '') return 'NONE';
  if (isDefaultProfileImage(imageUrl)) return 'DEFAULT';
  return 'CUSTOM';
};

const UserStatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { variant: 'default' as const, label: '활성', color: 'bg-green-500' };
      case 'SUSPENDED':
        return { variant: 'destructive' as const, label: '정지', color: 'bg-red-500' };
      case 'DORMANT':
        return { variant: 'secondary' as const, label: '휴면', color: 'bg-gray-500' };
      case 'WITHDRAWN':
        return { variant: 'outline' as const, label: '탈퇴', color: 'bg-gray-300' };
      default:
        return { variant: 'secondary' as const, label: '알 수 없음', color: 'bg-gray-400' };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ProfileImageCell = ({ user }: { user: UserWithImage }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // 🆕 마우스 위치

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (!user.profileImageUrl) {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
        <UserX className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className="relative w-12 h-12"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {imageError ? (
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <UserX className="w-6 h-6 text-red-400" />
          </div>
        ) : (
          <>
            <img
              src={user.profileImageUrl}
              alt={`${user.name}의 프로필`}
              className="w-12 h-12 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
            
            {/* 🆕 Hover 시 마우스 포인터 위에 큰 이미지 표시 (500x500) */}
            {isHovered && !imageError && !imageLoading && (
              <div 
                className="fixed z-50 pointer-events-none"
                style={{
                  left: Math.min(mousePosition.x + 20, window.innerWidth - 520), // 화면 밖으로 나가지 않도록
                  top: Math.max(mousePosition.y - 520, 10), // 마우스 포인터 위쪽, 화면 위로 나가지 않도록
                }}
              >
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 w-[500px] h-[500px]">
                  <img
                    src={user.profileImageUrl}
                    alt={`${user.name}의 프로필 (확대)`}
                    className="w-full h-full rounded-lg object-cover"
                  />
                </div>
                {/* 툴팁 화살표 */}
                <div 
                  className="absolute w-3 h-3 bg-white border-l border-b border-gray-300 transform rotate-45"
                  style={{
                    left: '30px', // 500px 박스에 맞게 조정
                    bottom: '-6px',
                  }}
                />
                {/* 사용자 이름 라벨 */}
                <div 
                  className="absolute left-0 right-0 text-center mt-2"
                  style={{ top: '100%' }}
                >
                  <span className="bg-black text-white text-sm px-3 py-2 rounded whitespace-nowrap">
                    {user.name}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          window.open(user.profileImageUrl, '_blank');
        }}
        className="h-8 w-8 p-0"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function UsersImagePage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserWithImage[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    content: [] as UserWithImage[]
  });
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithImage: 0,      // 실제 커스텀 이미지
    usersWithoutImage: 0,   // 이미지 없음
    usersWithDefaultImage: 0, // 🆕 기본 이미지
    activeUsersWithImage: 0,
    imageLoadErrors: 0
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    loginProvider: '',
    gender: '',
    searchKeyword: '',
    hasImage: ''
  });
  
  // 🆕 이전 필터 상태를 기억하여 실제 변경 여부 확인
  const prevFiltersRef = useRef<FilterState>(filters);

  const [currentPage, setCurrentPage] = useState(0);
  const [isRestoringState, setIsRestoringState] = useState(false);

  // 🆕 페이지 상태 저장/복원을 위한 키
  const STORAGE_KEY = 'usersimage_page_state';

  // 🆕 현재 페이지 상태 저장
  const savePageState = useCallback(() => {
    try {
      // 🔧 의미 있는 상태만 저장 (복원 중이거나 초기 상태가 아닐 때만)
      if (isRestoringState) {
        console.log('🚫 상태 복원 중이므로 저장하지 않음');
        return;
      }
      
      const hasValidPage = currentPage > 0;
      const hasValidFilters = Object.values(filters).some(value => value !== '');
      
      if (hasValidPage || hasValidFilters) {
        const state = {
          currentPage,
          filters,
          timestamp: Date.now()
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('💾 페이지 상태 저장 완료:', state);
        console.log('💾 저장된 sessionStorage 키:', STORAGE_KEY);
      } else {
        console.log('🚫 의미 없는 상태이므로 저장하지 않음:', { currentPage, filters });
      }
    } catch (error) {
      console.error('❌ 페이지 상태 저장 실패:', error);
    }
  }, [currentPage, filters, isRestoringState]);

  // 🆕 저장된 페이지 상태 복원
  const restorePageState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // 저장된 상태가 1시간 이내인 경우에만 복원 (옵션)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - state.timestamp < oneHour) {
          console.log('🔄 저장된 페이지 상태 복원 시도:', state);
          
          // 🔧 의미 있는 상태만 복원 (currentPage > 0 또는 필터가 설정된 경우)
          const hasValidPage = typeof state.currentPage === 'number' && state.currentPage > 0;
          const hasValidFilters = state.filters && Object.values(state.filters).some(value => value !== '');
          
          if (hasValidPage || hasValidFilters) {
            // 🔧 상태 복원 플래그를 즉시 설정
            setIsRestoringState(true);
            
            // 즉시 상태 복원 (setTimeout 제거)
            if (state.filters) {
              console.log('필터 복원:', state.filters);
              setFilters(state.filters);
            }
            if (hasValidPage) {
              console.log('페이지 복원:', state.currentPage);
              setCurrentPage(state.currentPage);
            }
            
            console.log('✅ 상태 복원 완료 - isRestoringState를 true로 설정');
            return true;
          } else {
            console.log('⚠️ 의미 없는 상태이므로 복원하지 않음:', state);
          }
        } else {
          console.log('⏰ 저장된 상태가 만료됨');
          // 만료된 상태 제거
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log('❌ 저장된 상태 없음');
      }
    } catch (error) {
      console.error('❌ 페이지 상태 복원 실패:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return false;
  }, []);

  // 🆕 사용자 상세 페이지로 이동 (상태 저장)
  const navigateToUserDetail = useCallback((userId: number) => {
    console.log('👤 사용자 상세 페이지로 이동:', userId);
    console.log('📊 현재 상태:', { currentPage, filters });
    
    savePageState(); // 현재 상태 저장
    console.log('💾 상태 저장 후 이동 실행');
    
    router.push(`/users/${userId}`);
  }, [savePageState, router, currentPage, filters]);

  // 클라이언트 사이드 필터링 함수
  const applyFilters = useCallback((users: UserWithImage[], filterState: FilterState, searchKeyword: string) => {
    return users.filter(user => {
      // 상태 필터
      if (filterState.status && user.status !== filterState.status) {
        return false;
      }
      
      // 로그인 방식 필터
      if (filterState.loginProvider && user.loginProvider !== filterState.loginProvider) {
        return false;
      }
      
      // 성별 필터
      if (filterState.gender && user.gender !== filterState.gender) {
        return false;
      }

      // 이미지 보유 여부 필터 (🆕 기본 이미지 분류 추가)
      if (filterState.hasImage) {
        const imageType = getImageType(user.profileImageUrl);
        if (filterState.hasImage === 'YES' && imageType !== 'CUSTOM') {
          return false; // 실제 커스텀 이미지만
        }
        if (filterState.hasImage === 'NO' && imageType !== 'NONE') {
          return false; // 이미지 없음만
        }
        if (filterState.hasImage === 'DEFAULT' && imageType !== 'DEFAULT') {
          return false; // 기본 이미지만
        }
      }
      
      // 검색어 필터
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(keyword);
        const matchesPhone = user.phoneNumber.includes(keyword);
        const matchesUserId = user.userId.toString().includes(keyword);
        if (!matchesName && !matchesPhone && !matchesUserId) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // 페이지별 데이터 분할
  const getPaginatedData = useCallback((users: UserWithImage[], page: number, size: number) => {
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return {
      content: paginatedUsers,
      totalElements: users.length,
      totalPages: Math.ceil(users.length / size),
      page: page,
      size: size
    };
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('사용자 이미지 정보 API 호출 중...');
      
      // 프로필 이미지 포함하여 모든 사용자 데이터 가져오기
      const params = {
        page: 0,
        size: 10000,
        includeWithdrawn: true,
        includeProfileImage: true // 프로필 이미지 포함 옵션
      };
      
      const response = await userService.getUsers(params);
      
      console.log('API 응답:', response);
      
      // 실제 API 응답 데이터 사용 (목 데이터로 덮어쓰지 않음)
      const usersWithImages = (response.content || []).map((user: UserWithImage) => ({
        ...user,
        // 실제 profileImageUrl이 있으면 그대로 사용, 없으면 undefined
        profileImageUrl: user.profileImageUrl || undefined
      }));

      setAllUsers(usersWithImages);

      // 🔧 이미지 타입별 통계 계산
      const usersWithCustomImage = usersWithImages.filter((user: UserWithImage) => 
        getImageType(user.profileImageUrl) === 'CUSTOM'
      ).length;
      
      const usersWithDefaultImage = usersWithImages.filter((user: UserWithImage) => 
        getImageType(user.profileImageUrl) === 'DEFAULT'
      ).length;
      
      const usersWithoutImage = usersWithImages.filter((user: UserWithImage) => 
        getImageType(user.profileImageUrl) === 'NONE'
      ).length;
      
      const activeUsersWithCustomImage = usersWithImages.filter((user: UserWithImage) => 
        user.status === 'ACTIVE' && getImageType(user.profileImageUrl) === 'CUSTOM'
      ).length;

      setStats({
        totalUsers: usersWithImages.length,
        usersWithImage: usersWithCustomImage,      // 실제 커스텀 이미지
        usersWithoutImage: usersWithoutImage,      // 이미지 없음
        usersWithDefaultImage: usersWithDefaultImage, // 기본 이미지
        activeUsersWithImage: activeUsersWithCustomImage,
        imageLoadErrors: 0
      });

    } catch (error) {
      console.error('사용자 이미지 목록 로딩 실패:', error);
      
      // API 실패 시 빈 데이터로 초기화
      setAllUsers([]);
      setStats({
        totalUsers: 0,
        usersWithImage: 0,
        usersWithoutImage: 0,
        usersWithDefaultImage: 0, // 🆕 기본 이미지 통계 추가
        activeUsersWithImage: 0,
        imageLoadErrors: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 필터링 및 페이지네이션 적용
  useEffect(() => {
    console.log('🔍 필터링 useEffect 실행:', {
      allUsersLength: allUsers.length,
      filters: filters,
      isRestoringState: isRestoringState
    });
    
    const filtered = applyFilters(allUsers, filters, filters.searchKeyword);
    setFilteredUsers(filtered);
    
    // 🔧 필터 실제 변경 여부 확인
    const filtersHaveChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    
    // 🔧 상태 복원이 아니고 필터가 실제로 변경된 경우에만 첫 페이지로 이동
    if (!isRestoringState && filtersHaveChanged && currentPage > 0) {
      console.log('⚠️ 필터 변경으로 첫 페이지로 이동:', { prev: prevFiltersRef.current, current: filters });
      setCurrentPage(0);
    } else if (!isRestoringState && currentPage > 0) {
      console.log('✅ 필터 변경 없음 - 현재 페이지 유지:', currentPage);
    } else if (!isRestoringState) {
      console.log('⚠️ 초기 로드 - 첫 페이지로 설정');
      setCurrentPage(0);
    } else {
      console.log('✅ 상태 복원 중이므로 페이지 유지');
    }
    
    // 이전 필터 상태 업데이트
    prevFiltersRef.current = { ...filters };
    
    // 현재 페이지 계산 (필터 변경 시에만 0으로 리셋)
    const shouldResetPage = !isRestoringState && filtersHaveChanged;
    const targetPage = shouldResetPage ? 0 : currentPage;
    const paginatedData = getPaginatedData(filtered, targetPage, 20);
    setPagination({
      ...paginatedData,
      content: paginatedData.content
    });
    
    console.log('🔍 필터 적용 완료:', {
      totalUsers: allUsers.length,
      filteredUsers: filtered.length,
      filters: filters,
      isRestoringState: isRestoringState,
      currentPage: currentPage,
      targetPage: targetPage
    });
    
    // 🔧 상태 복원 중일 때는 페이지 상태 저장하지 않음
    if (!isRestoringState) {
      savePageState();
    }
  }, [allUsers, filters, applyFilters, getPaginatedData, isRestoringState]); // savePageState 제거 // 🔧 currentPage 제거로 순환 참조 방지

  // 페이지 변경 시에만 페이지네이션 업데이트
  useEffect(() => {
    const paginatedData = getPaginatedData(filteredUsers, currentPage, 20);
    setPagination(prev => ({
      ...prev,
      ...paginatedData,
      content: paginatedData.content
    }));
  }, [filteredUsers, currentPage, getPaginatedData]);

  // 🔄 초기 데이터 로드 및 상태 복원
  useEffect(() => {
    const initializePage = async () => {
      console.log('🚀 페이지 초기화 시작');
      
      // 1. 저장된 상태 복원 시도
      const stateRestored = restorePageState();
      console.log('상태 복원 결과:', stateRestored);
      
      // 2. 데이터 로드
      await loadUsers();
      console.log('✅ 사용자 데이터 로드 완료');
      
      // 3. 상태 복원 완료 표시 (충분한 시간 후)
      if (stateRestored) {
        // 🔧 더 긴 시간 후에 복원 플래그 해제 (필터링이 안정화될 때까지)
        setTimeout(() => {
          console.log('🔄 상태 복원 플래그 해제');
          setIsRestoringState(false);
        }, 2000); // 2초로 증가
      } else {
        console.log('🆕 새로운 페이지 로드');
      }
    };
    
    initializePage();
  }, [loadUsers, restorePageState]);

  // 🆕 페이지를 떠날 때 상태 자동 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePageState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        savePageState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [savePageState]);

  // 🆕 필터나 페이지 변경 시에도 자동 저장
  useEffect(() => {
    if (!isRestoringState) {
      savePageState();
    }
  }, [currentPage, filters, savePageState, isRestoringState]);

  const handleSearch = () => {
    console.log('검색 버튼 클릭, 현재 검색어:', filters.searchKeyword);
  };

  const handlePageChange = (newPage: number) => {
    console.log('페이지 변경:', newPage);
    if (newPage >= 0 && newPage < (pagination.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  // 페이지네이션 번호 생성
  const generatePageNumbers = () => {
    const totalPages = pagination.totalPages || 1;
    const maxVisiblePages = 10;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">사용자 프로필 이미지 관리</h1>
          <p className="text-muted-foreground">리워드 플랫폼 서비스 사용자의 프로필 이미지를 관리합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            총 {(pagination.totalElements || 0).toLocaleString()}명 중 
            {' '}
            {Math.min(currentPage * 20 + 1, pagination.totalElements || 0)}-
            {Math.min((currentPage + 1) * 20, pagination.totalElements || 0)}명 표시
          </div>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 프로필 이미지 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalUsers || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">실제 이미지</CardTitle>
            <ImageIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(stats.usersWithImage || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체의 {stats.totalUsers > 0 ? Math.round((stats.usersWithImage / stats.totalUsers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">기본 이미지</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{(stats.usersWithDefaultImage || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체의 {stats.totalUsers > 0 ? Math.round((stats.usersWithDefaultImage / stats.totalUsers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이미지 없음</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{(stats.usersWithoutImage || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체의 {stats.totalUsers > 0 ? Math.round((stats.usersWithoutImage / stats.totalUsers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성+실제이미지</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(stats.activeUsersWithImage || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">로드 실패</CardTitle>
            <UserMinus className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(stats.imageLoadErrors || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">상태</label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => {
                  setFilters({...filters, status: value === "all" ? "" : value});
                }}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="SUSPENDED">정지</SelectItem>
                  <SelectItem value="DORMANT">휴면</SelectItem>
                  <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">이미지 보유</label>
              <Select 
                value={filters.hasImage || "all"} 
                onValueChange={(value) => {
                  setFilters({...filters, hasImage: value === "all" ? "" : value});
                }}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="YES">실제 이미지</SelectItem>
                  <SelectItem value="DEFAULT">기본 이미지</SelectItem>
                  <SelectItem value="NO">이미지 없음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">로그인 방식</label>
              <Select 
                value={filters.loginProvider || "all"} 
                onValueChange={(value) => {
                  setFilters({...filters, loginProvider: value === "all" ? "" : value});
                }}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="모든 방식" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  <SelectItem value="all">모든 방식</SelectItem>
                  <SelectItem value="KAKAO">카카오</SelectItem>
                  <SelectItem value="APPLE">애플</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">성별</label>
              <Select 
                value={filters.gender || "all"} 
                onValueChange={(value) => {
                  setFilters({...filters, gender: value === "all" ? "" : value});
                }}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="모든 성별" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  <SelectItem value="all">모든 성별</SelectItem>
                  <SelectItem value="M">남성</SelectItem>
                  <SelectItem value="F">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">검색</label>
              <Input
                placeholder="이름, 전화번호, 사용자ID로 검색"
                value={filters.searchKeyword}
                onChange={(e) => {
                  setFilters({...filters, searchKeyword: e.target.value});
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                검색
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            사용자 프로필 이미지 목록 ({(pagination.totalElements || 0).toLocaleString()}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로필 이미지</TableHead>
                <TableHead>사용자ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>로그인방식</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>이미지 URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.content?.map((user, index) => (
                <TableRow 
                  key={user.userId || `user-${index}`}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => navigateToUserDetail(user.userId)}
                >
                  <TableCell>
                    <ProfileImageCell user={user} />
                  </TableCell>
                  <TableCell className="font-medium">{user.userId}</TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>{user.loginProvider || 'N/A'}</TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    {user.registeredAt 
                      ? new Date(user.registeredAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {user.gender === 'M' ? '남성' : 
                     user.gender === 'F' ? '여성' : '미등록'}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const imageType = getImageType(user.profileImageUrl);
                      
                      if (imageType === 'CUSTOM') {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs bg-green-600">
                              실제 이미지
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(user.profileImageUrl || '');
                              }}
                              className="h-6 w-6 p-0 text-blue-600"
                              title="URL 복사"
                            >
                              📋
                            </Button>
                          </div>
                        );
                      }
                      
                      if (imageType === 'DEFAULT') {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              기본 이미지
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(user.profileImageUrl || '');
                              }}
                              className="h-6 w-6 p-0 text-blue-600"
                              title="URL 복사"
                            >
                              📋
                            </Button>
                          </div>
                        );
                      }
                      
                      return (
                        <Badge variant="outline" className="text-xs">
                          없음
                        </Badge>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(pagination.content?.length || 0) === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              사용자를 찾을 수 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 0}
        >
          이전
        </Button>
        
        <div className="flex items-center space-x-1">
          {generatePageNumbers().map(pageNum => (
            <Button
              key={`page-${pageNum}`}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum + 1}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= (pagination.totalPages || 1) - 1}
        >
          다음
        </Button>
      </div>
    </div>
  );
}