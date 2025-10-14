'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import { userService } from '@/services/api';

interface User {
  userId: number;
  name: string;
  phoneNumber: string;
  email: string;
  loginProvider: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DORMANT' | 'WITHDRAWN';
  registeredAt: string;
  lastAccessDate: string;
  gender: 'M' | 'F' | '';
}

interface FilterState {
  status: string;
  loginProvider: string;
  gender: string;
  searchKeyword: string;
}

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

// const ThemeToggle = () => {
//   const { theme, setTheme } = useTheme();
  
//   return (
//     <Button
//       variant="outline"
//       size="icon"
//       onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
//       className="ml-2"
//     >
//       <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//       <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//       <span className="sr-only">테마 변경</span>
//     </Button>
//   );
// };

export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]); // 전체 사용자 데이터
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // 필터링된 사용자 데이터
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    content: [] as User[]
  });
  
  // 전체 사용자 통계 (API에서 받아온 실제 통계)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    dormantUsers: 0,
    withdrawnUsers: 0,
    todayNewUsers: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    loginProvider: '',
    gender: '',
    searchKeyword: ''
  });

  const [currentPage, setCurrentPage] = useState(0); // 🔧 페이지 상태 분리

  // 🔧 클라이언트 사이드 필터링 함수
  const applyFilters = useCallback((users: User[], filterState: FilterState, searchKeyword: string) => {
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
      
      // 검색어 필터 (이름, 전화번호 부분 검색)
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(keyword);
        const matchesPhone = user.phoneNumber.includes(keyword); // 전화번호는 대소문자 구분 없이 부분 검색
        if (!matchesName && !matchesPhone) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // 🔧 페이지별 데이터 분할
  const getPaginatedData = useCallback((users: User[], page: number, size: number) => {
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
      
      console.log('API 호출 중...');
      
      // 🔧 백엔드에서 모든 사용자 데이터 가져오기 (탈퇴 포함)
      const params = {
        page: 0,
        size: 10000, // 충분히 큰 사이즈로 모든 데이터 가져오기
        includeWithdrawn: true // 탈퇴 사용자도 포함
      };
      
      const response = await userService.getUsers(params);
      
      console.log('API 응답:', response);
      
      setAllUsers(response.content || []);

      // 사용자 통계도 실제 API에서 가져오기
      try {
        const statsResponse = await userService.getUserStats();
        setStats({
          totalUsers: statsResponse.totalUsers || 0,
          activeUsers: statsResponse.activeUsers || 0,
          suspendedUsers: statsResponse.suspendedUsers || 0,
          dormantUsers: statsResponse.dormantUsers || 0,
          withdrawnUsers: statsResponse.withdrawnUsers || 0,
          todayNewUsers: statsResponse.todayNewUsers || 0
        });
      } catch (statsError) {
        console.error('사용자 통계 로딩 실패:', statsError);
        // 통계 실패해도 사용자 목록은 표시
        setStats({
          totalUsers: response.content?.length || 0,
          activeUsers: 0,
          suspendedUsers: 0,
          dormantUsers: 0,
          withdrawnUsers: 0,
          todayNewUsers: 0
        });
      }

    } catch (error) {
      console.error('사용자 목록 로딩 실패:', error);
      
      // API 실패 시 빈 데이터로 초기화
      setAllUsers([]);
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        dormantUsers: 0,
        withdrawnUsers: 0,
        todayNewUsers: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 필터링 및 페이지네이션 적용
  useEffect(() => {
    const filtered = applyFilters(allUsers, filters, filters.searchKeyword);
    setFilteredUsers(filtered);
    
    // 필터 변경 시 첫 페이지로 이동
    setCurrentPage(0);
    
    // 페이지네이션 업데이트
    const paginatedData = getPaginatedData(filtered, 0, 20);
    setPagination({
      ...paginatedData,
      content: paginatedData.content
    });
    
    console.log('필터 적용 완료:', {
      totalUsers: allUsers.length,
      filteredUsers: filtered.length,
      filters: filters
    });
  }, [allUsers, filters, applyFilters, getPaginatedData]);

  // 🔧 페이지 변경 시에만 페이지네이션 업데이트
  useEffect(() => {
    const paginatedData = getPaginatedData(filteredUsers, currentPage, 20);
    setPagination(prev => ({
      ...prev,
      ...paginatedData,
      content: paginatedData.content
    }));
  }, [filteredUsers, currentPage, getPaginatedData]);

  // 🔧 검색어 디바운싱 수정 (너무 민감하지 않게)
  useEffect(() => {
    if (filters.searchKeyword.length === 0) {
      // 검색어가 비어있으면 즉시 필터 해제
      return;
    }
    
    if (filters.searchKeyword.length >= 2) {
      // 2글자 이상일 때만 디바운싱 적용
      const debounceTimer = setTimeout(() => {
        console.log('검색어 디바운싱 적용:', filters.searchKeyword);
      }, 300); // 300ms로 단축

      return () => clearTimeout(debounceTimer);
    }
  }, [filters.searchKeyword]);

  // 초기 데이터 로드
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = () => {
    console.log('검색 버튼 클릭, 현재 검색어:', filters.searchKeyword);
    // 필터 상태가 이미 업데이트되어 있으므로 별도 작업 불필요
  };

  const handlePageChange = (newPage: number) => {
    console.log('페이지 변경:', newPage);
    if (newPage >= 0 && newPage < (pagination.totalPages || 1)) {
      setCurrentPage(newPage); // 🔧 currentPage 상태 업데이트
    }
  };

  // 🔧 페이지네이션 번호 생성 로직 수정 - 1~10개 페이지 표시
  const generatePageNumbers = () => {
    const totalPages = pagination.totalPages || 1;
    const maxVisiblePages = 10; // 🔧 5개 → 10개로 증가
    
    // 전체 페이지가 10개 이하면 모든 페이지 표시
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    
    // 현재 페이지를 중심으로 표시할 페이지 계산
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // 시작 페이지가 뒤로 밀리는 경우 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // const handleExportCSV = () => {
  //   const csvContent = [
  //     ['사용자ID', '이름', '전화번호', '이메일', '로그인방식', '상태', '가입일', '최근접속', '성별'].join(','),
  //     ...filteredUsers.map(user => [
  //       user.userId || '',
  //       user.name || '',
  //       user.phoneNumber || '',
  //       user.email || '',
  //       user.loginProvider || '',
  //       user.status || '',
  //       user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '',
  //       user.lastAccessDate ? new Date(user.lastAccessDate).toLocaleDateString() : '',
  //       user.gender === 'M' ? '남성' : user.gender === 'F' ? '여성' : '미등록'
  //     ].join(','))
  //   ].join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleUserDelete = async (userId: number, userName: string) => {
    if (!confirm(`정말로 사용자 "${userName}"를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      // 실제 삭제 API가 있다면 사용하고, 없다면 상태를 DELETED로 변경
      await userService.updateUserStatus(userId, { 
        status: 'DELETED', 
        reason: '관리자 삭제' 
      });
      loadUsers(); // 전체 데이터 다시 로드
      alert('사용자가 삭제되었습니다.');
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      alert('사용자 삭제에 실패했습니다.');
    }
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
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground">리워드 플랫폼 서비스 사용자를 관리합니다</p>
        </div>
        <div className="flex items-center gap-4">
          {/* 통계 정보 - 타이틀 오른쪽으로 이동 */}
          <div className="text-sm text-muted-foreground">
            총 {(pagination.totalElements || 0).toLocaleString()}명 중 
            {' '}
            {Math.min(currentPage * 20 + 1, pagination.totalElements || 0)}-
            {Math.min((currentPage + 1) * 20, pagination.totalElements || 0)}명 표시
          </div>
          {/*<div className="flex gap-2">*/}
          {/*  <Button onClick={loadUsers} variant="outline">*/}
          {/*    <RefreshCw className="w-4 h-4 mr-2" />*/}
          {/*    새로고침*/}
          {/*  </Button>*/}
          {/*  <Button onClick={handleExportCSV} variant="outline">*/}
          {/*    <Download className="w-4 h-4 mr-2" />*/}
          {/*    CSV 다운로드*/}
          {/*  </Button>*/}
          {/*  <ThemeToggle />*/}
          {/*</div>*/}
        </div>
      </div>

      {/* 통계 카드 */}
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
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(stats.activeUsers || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체의 {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정지 사용자</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(stats.suspendedUsers || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">휴면 사용자</CardTitle>
            <UserMinus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{(stats.dormantUsers || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">탈퇴 사용자</CardTitle>
            <UserX className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{(stats.withdrawnUsers || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 신규가입</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(stats.todayNewUsers || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">상태</label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => {
                  console.log('상태 필터 변경:', value);
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
              <label className="text-sm font-medium mb-2 block">로그인 방식</label>
              <Select 
                value={filters.loginProvider || "all"} 
                onValueChange={(value) => {
                  console.log('로그인 방식 필터 변경:', value);
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
                  console.log('성별 필터 변경:', value);
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
                placeholder="이름, 전화번호로 검색 (전화번호는 부분검색 가능)"
                value={filters.searchKeyword}
                onChange={(e) => {
                  console.log('검색어 입력:', e.target.value);
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
            사용자 목록 ({(pagination.totalElements || 0).toLocaleString()}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>로그인방식</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>최근접속</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.content?.map((user, index) => (
                <TableRow 
                  key={user.userId || `user-${index}`}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => router.push(`/users/${user.userId}`)}
                >
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
                    {user.lastAccessDate 
                      ? new Date(user.lastAccessDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {user.gender === 'M' ? '남성' : 
                     user.gender === 'F' ? '여성' : '미등록'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // row 클릭 이벤트 방지
                        handleUserDelete(user.userId, user.name || 'Unknown');
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* 🔧 완전히 수정된 페이지네이션 - 정가운데 배치 */}
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
