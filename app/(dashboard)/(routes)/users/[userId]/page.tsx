'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Calendar, 
  Smartphone,
  Mail,
  User,
  CreditCard,
  Activity,
  AlertTriangle,
  Ban,
  UserCheck,
  Gift,
  GamepadIcon,
  TrendingUp,
  Clock
} from 'lucide-react';
import { userService } from '@/services/api';
import AdminIssueManagement from '@/components/AdminIssueManagement';

// 타입 정의 추가
interface TransactionData {
  transactionId: number;
  transactionType: string;
  amount: number;
  sourceType: string;
  sourceId?: number;
  description: string;
  transactionTime: string;
  balanceAfter?: number;
  status: string;
}

interface GameHistoryData {
  logId: number;
  actionId: number;
  actionName: string;
  performedTime: string;
  ticketsEarned: number;
  description: string;
  isEventApplied?: boolean;
  eventId?: number;
  eventName?: string;
  isExtraChance?: boolean;
  extraChanceId?: number;
}

interface InviteInfoData {
  inviterInfo?: {
    userId: number;
    name: string;
    email: string;
    invitedAt: string;
    inviteCode: string;
  };
  inviteeList: Array<{
    userId: number;
    name: string;
    email: string;
    invitedAt: string;
    isSignupCompleted: boolean;
    status: string;
    inviteCode: string;
  }>;
  totalInvites: number;
  activeInvites: number;
  inviteCodes: Array<{
    code: string;
    createdAt: string;
    usageCount: number;
    isActive: boolean;
  }>;
}

interface ActivityData {
  activityId: number;
  activityType: string;
  description: string;
  activityTime: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  ipAddress?: string;
  deviceInfo?: string;
  additionalData?: string;
}

interface UserDetail {
  userInfo: {
    userId: number;
    name: string;
    phoneNumber: string;
    loginProvider: string;
    registeredAt: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'DORMANT' | 'WITHDRAWN';
    gender: string;
  };
  balanceInfo: {
    points: number;
    tickets: number;
    totalEarnedPoints: number;
    totalUsedPoints: number;
  };
  activityInfo: {
    activeDays: number;
    lastAccessDate: string;
    totalRandomBoxOpens: number;
    totalDrawParticipations: number;
  };
  suspensionHistory: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    adminName: string;
  }>;
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

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [userId, setUserId] = useState<string>('');

  // 모든 기능에 필요한 상태들 추가
  // const [recentActivities, setRecentActivities] = useState([]);
  // const [pointHistory, setPointHistory] = useState([]);
  // const [ticketHistory, setTicketHistory] = useState([]);
  // const [gameHistory, setGameHistory] = useState([]);
  // const [inviteInfo, setInviteInfo] = useState({
  //   invitedBy: null,
  //   invitedUsers: [],
  //   totalInvites: 0
  // });

  const loadUserDetail = async () => {
    try {
      setLoading(true);

      // 🔄 실제 백엔드 API 호출로 변경
      console.log('사용자 상세 정보 로딩 시작:', userId);

      try {
        // 실제 백엔드 API 호출 시도
        const userData = await userService.getUserById(userId);
        console.log('백엔드에서 받은 사용자 데이터:', userData);

        // 백엔드 응답을 프론트엔드 형식으로 변환
        const mappedUserData = {
          userInfo: {
            userId: userData.userInfo?.userId || parseInt(userId),
            name: userData.userInfo?.name || `사용자${userId}`,
            phoneNumber: userData.userInfo?.phoneNumber || '010-0000-0000',
            loginProvider: userData.userInfo?.loginProvider || 'KAKAO',
            registeredAt: userData.userInfo?.registeredAt || new Date().toISOString(),
            status: userData.userInfo?.status || 'ACTIVE',
            gender: userData.userInfo?.gender || 'M'
          },
          balanceInfo: {
            points: userData.balanceInfo?.points || 0,
            tickets: userData.balanceInfo?.tickets || 0,
            totalEarnedPoints: userData.balanceInfo?.totalEarnedPoints || 0,
            totalUsedPoints: userData.balanceInfo?.totalUsedPoints || 0
          },
          activityInfo: {
            activeDays: userData.activityInfo?.activeDays || 0,
            lastAccessDate: userData.activityInfo?.lastAccessDate || new Date().toISOString(),
            totalRandomBoxOpens: userData.activityInfo?.totalRandomBoxOpens || 0,
            totalDrawParticipations: userData.activityInfo?.totalDrawParticipations || 0
          },
          suspensionHistory: userData.suspensionHistory || []
        };

        setUser(mappedUserData);
        console.log('사용자 데이터 매핑 완료:', mappedUserData);

      } catch (apiError) {
        console.warn('백엔드 API 호출 실패, 목 데이터 사용:', apiError);

        // API 실패 시 목 데이터 생성
        const mockUserData = {
          userInfo: {
            userId: parseInt(userId || '1'),
            name: `사용자${userId}`,
            phoneNumber: '010-1234-5678',
            loginProvider: 'KAKAO',
            registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE' as const,
            gender: 'M'
          },
          balanceInfo: {
            points: Math.floor(Math.random() * 50000) + 10000,
            tickets: Math.floor(Math.random() * 100) + 10,
            totalEarnedPoints: Math.floor(Math.random() * 200000) + 50000,
            totalUsedPoints: Math.floor(Math.random() * 150000) + 30000
          },
          activityInfo: {
            activeDays: Math.floor(Math.random() * 100) + 30,
            lastAccessDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalRandomBoxOpens: Math.floor(Math.random() * 500) + 50,
            totalDrawParticipations: Math.floor(Math.random() * 200) + 20
          },
          suspensionHistory: []
        };

        setUser(mockUserData);
      }

    } catch (error) {
      console.error('사용자 상세 정보 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // params를 Promise로 처리
    params.then(({ userId: paramUserId }) => {
      setUserId(paramUserId);
    });
  }, [params]);

  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuspendUser = async () => {
    try {
      await userService.suspendUser(parseInt(userId), {
        reason: suspendReason
      });

      setShowSuspendDialog(false);
      setSuspendReason('');

      // 데이터 새로고침
      loadUserDetail();

      alert('이용정지 처리가 완료되었습니다.');
    } catch (error) {
      console.error('이용정지 처리 실패:', error);
      alert('이용정지 처리에 실패했습니다.');
    }
  };

  const handleUnsuspendUser = async () => {
    try {
      await userService.unsuspendUser(parseInt(userId), '관리자 해제');
      loadUserDetail();
      alert('이용정지가 해제되었습니다.');
    } catch (error) {
      console.error('이용정지 해제 실패:', error);
      alert('이용정지 해제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">사용자를 찾을 수 없습니다.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {user.userInfo?.name || 'N/A'}
              <UserStatusBadge status={user.userInfo?.status || 'UNKNOWN'} />
            </h1>
            <p className="text-muted-foreground">
              사용자 ID: {user.userInfo?.userId || 'N/A'} | 
              가입일: {user.userInfo?.registeredAt 
                ? new Date(user.userInfo.registeredAt).toLocaleDateString()
                : 'N/A'
              } |
              {user.userInfo?.loginProvider || 'N/A'} 로그인
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {user.userInfo?.status === 'ACTIVE' && (
            <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  이용정지
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>이용정지 처리</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">정지 사유</label>
                    <Textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="정지 사유를 입력하세요"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
                    취소
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleSuspendUser}
                    disabled={!suspendReason.trim()}
                  >
                    정지 처리
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {user.userInfo?.status === 'SUSPENDED' && (
            <Button 
              variant="default" 
              onClick={handleUnsuspendUser}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              정지 해제
            </Button>
          )}
        </div>
      </div>

      {/* 사용자 기본 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보유 포인트</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(user.balanceInfo?.points || 0).toLocaleString()}P</div>
            <p className="text-xs text-muted-foreground">
              총 획득: {(user.balanceInfo?.totalEarnedPoints || 0).toLocaleString()}P
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보유 티켓</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(user.balanceInfo?.tickets || 0).toLocaleString()}장</div>
            <p className="text-xs text-muted-foreground">
              사용량: {(user.balanceInfo?.totalUsedPoints || 0).toLocaleString()}P
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활동 일수</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.activityInfo?.activeDays || 0}일</div>
            <p className="text-xs text-muted-foreground">
              최근 접속: {user.activityInfo?.lastAccessDate 
                ? new Date(user.activityInfo.lastAccessDate).toLocaleDateString()
                : '없음'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">게임 활동</CardTitle>
            <GamepadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>박스: {user.activityInfo?.totalRandomBoxOpens || 0}회</div>
              <div>뽑기: {user.activityInfo?.totalDrawParticipations || 0}회</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="admin-issue">관리자 지급</TabsTrigger>
          <TabsTrigger value="activity">활동 내역</TabsTrigger>
          <TabsTrigger value="transactions">거래 내역</TabsTrigger>
          <TabsTrigger value="games">게임 기록</TabsTrigger>
          <TabsTrigger value="invite">초대 정보</TabsTrigger>
          <TabsTrigger value="devices">디바이스 정보</TabsTrigger>
          <TabsTrigger value="sanctions">제재 이력</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">이름</div>
                      <div className="text-sm text-muted-foreground">{user.userInfo?.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">전화번호</div>
                      <div className="text-sm text-muted-foreground">
                        {user.userInfo?.phoneNumber || '미등록'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">로그인 방식</div>
                      <div className="text-sm text-muted-foreground">{user.userInfo?.loginProvider || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">가입일</div>
                      <div className="text-sm text-muted-foreground">
                        {user.userInfo?.registeredAt 
                          ? new Date(user.userInfo.registeredAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">성별</div>
                      <div className="text-sm text-muted-foreground">
                        {user.userInfo?.gender === 'M' ? '남성' : 
                         user.userInfo?.gender === 'F' ? '여성' : '미등록'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">최근 접속</div>
                      <div className="text-sm text-muted-foreground">
                        {user.activityInfo?.lastAccessDate 
                          ? new Date(user.activityInfo.lastAccessDate).toLocaleString()
                          : '접속 기록 없음'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 관리자 지급 탭 */}
        <TabsContent value="admin-issue" className="space-y-4">
          <AdminIssueManagement 
            userId={userId} 
            userName={user.userInfo?.name || `사용자${userId}`} 
          />
        </TabsContent>

        {/* 활동 내역 탭 */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                최근 활동 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTable userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 거래 내역 탭 */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>포인트 거래 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable type="point" userId={userId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>티켓 거래 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable type="ticket" userId={userId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 게임 기록 탭 */}
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GamepadIcon className="w-5 h-5" />
                게임 참여 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GameHistoryTable userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 초대 정보 탭 */}
        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                초대 네트워크
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InviteInfoTable userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 디바이스 정보 탭 */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                등록된 디바이스
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceInfoTable userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 제재 이력 탭 */}
        <TabsContent value="sanctions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                이용정지 이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.suspensionHistory && user.suspensionHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>정지 시작</TableHead>
                      <TableHead>정지 종료</TableHead>
                      <TableHead>사유</TableHead>
                      <TableHead>처리자</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.suspensionHistory.map((suspension, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {suspension.startDate ? new Date(suspension.startDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {suspension.endDate 
                            ? new Date(suspension.endDate).toLocaleDateString()
                            : '해제됨'
                          }
                        </TableCell>
                        <TableCell>{suspension.reason || '사유 없음'}</TableCell>
                        <TableCell>{suspension.adminName || '시스템'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  이용정지 이력이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 거래 내역 테이블 컴포넌트
function TransactionTable({ type, userId }: { type: 'point' | 'ticket'; userId: string }) {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`${type} 거래 내역 로딩 시작: userId=${userId}, type=${type}`);

        const data = await userService.getUserTransactions(userId, type);
        console.log(`${type} 거래 내역 API 응답:`, data);

        if (data && data.content) {
          setTransactions(data.content);
          console.log(`${type} 거래 내역 설정 완료: ${data.content.length}건`);
        } else if (data && Array.isArray(data)) {
          setTransactions(data);
          console.log(`${type} 거래 내역 배열 형태: ${data.length}건`);
        } else {
          console.warn(`${type} 거래 내역 응답 형태가 예상과 다름:`, data);
          setTransactions([]);
        }

      } catch (error) {
        console.error(`${type} 거래 내역 로딩 실패:`, error);
        setError(`${type} 거래 내역을 불러오는데 실패했습니다.`);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadTransactions();
    }
  }, [userId, type]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">{type === 'point' ? '포인트' : '티켓'} 거래 내역 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2"
          variant="outline"
          size="sm"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {type === 'point' ? '포인트' : '티켓'} 거래 내역이 없습니다.
        <br />
        <small className="text-xs">API 연결: {userId ? '정상' : '사용자 ID 없음'}</small>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>금액</TableHead>
          <TableHead>설명</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.slice(0, 10).map((transaction, index) => (
          <TableRow key={transaction.transactionId || index}>
            <TableCell>
              {new Date(transaction.transactionTime).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant={transaction.transactionType === 'EARN' ? 'default' : 'secondary'}>
                {transaction.transactionType === 'EARN' ? '획득' : '사용'}
              </Badge>
            </TableCell>
            <TableCell>
              {transaction.amount?.toLocaleString()}{type === 'point' ? 'P' : '장'}
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// 게임 기록 테이블 컴포넌트
function GameHistoryTable({ userId }: { userId: string }) {
  const [gameHistory, setGameHistory] = useState<GameHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameHistory = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserGameHistory(userId);
        setGameHistory(data.content || []);
      } catch (error) {
        console.error('게임 기록 로딩 실패:', error);
        setGameHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadGameHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">로딩 중...</p>
      </div>
    );
  }

  if (gameHistory.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        게임 참여 기록이 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>게임</TableHead>
          <TableHead>획득 티켓</TableHead>
          <TableHead>추가 기회</TableHead>
          <TableHead>설명</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameHistory.slice(0, 15).map((game, index) => (
          <TableRow key={game.logId || index}>
            <TableCell>
              {new Date(game.performedTime).toLocaleDateString()}
            </TableCell>
            <TableCell>{game.actionName}</TableCell>
            <TableCell>
              <Badge variant="default">
                {game.ticketsEarned}장
              </Badge>
            </TableCell>
            <TableCell>
              {game.isExtraChance ? (
                <Badge variant="secondary">광고 기회</Badge>
              ) : (
                <span className="text-muted-foreground">일반</span>
              )}
            </TableCell>
            <TableCell>{game.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// 초대 정보 테이블 컴포넌트
function InviteInfoTable({ userId }: { userId: string }) {
  const [inviteInfo, setInviteInfo] = useState<InviteInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInviteInfo = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserInviteInfo(userId);
        setInviteInfo(data);
      } catch (error) {
        console.error('초대 정보 로딩 실패:', error);
        setInviteInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadInviteInfo();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">로딩 중...</p>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        초대 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 초대 요약 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inviteInfo.totalInvites || 0}</div>
            <p className="text-xs text-muted-foreground">총 초대 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inviteInfo.activeInvites || 0}</div>
            <p className="text-xs text-muted-foreground">활성 초대 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inviteInfo.inviteCodes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">보유 초대 코드</p>
          </CardContent>
        </Card>
      </div>

      {/* 초대받은 정보 */}
      {inviteInfo.inviterInfo && (
        <div>
          <h3 className="text-lg font-medium mb-3">초대받은 정보</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <User className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{inviteInfo.inviterInfo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteInfo.inviterInfo.email || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    초대일: {new Date(inviteInfo.inviterInfo.invitedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 초대한 사용자 목록 */}
      {inviteInfo.inviteeList && inviteInfo.inviteeList.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">초대한 사용자 ({inviteInfo.inviteeList.length}명)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>초대일</TableHead>
                <TableHead>가입 완료</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteInfo.inviteeList.slice(0, 10).map((invitee, index) => (
                <TableRow key={invitee.userId || index}>
                  <TableCell>{invitee.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitee.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(invitee.invitedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invitee.isSignupCompleted ? 'default' : 'secondary'}>
                      {invitee.isSignupCompleted ? '완료' : '미완료'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={invitee.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {invitee.status === 'ACTIVE' ? '활성' : 
                       invitee.status === 'SUSPENDED' ? '정지' :
                       invitee.status === 'DORMANT' ? '휴면' : '탈퇴'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// 디바이스 정보 인터페이스 정의
interface DeviceInfo {
  deviceId: string;
  deviceUuid: string;
  deviceType: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  ipAddress: string;
  lastLoginTsp: string;
  isActive: boolean;
  pushToken: string;
}

// 디바이스 정보 테이블 컴포넌트
function DeviceInfoTable({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        // 사용자 상세 정보에서 디바이스 정보 추출
        const userData = await userService.getUserById(userId);
        
        if (userData && userData.deviceInfo) {
          setDevices(userData.deviceInfo);
        } else {
          setDevices([]);
        }
      } catch (error) {
        console.error('디바이스 정보 로딩 실패:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadDevices();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">디바이스 정보 로딩 중...</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        등록된 디바이스가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>디바이스 타입</TableHead>
          <TableHead>모델</TableHead>
          <TableHead>OS 버전</TableHead>
          <TableHead>앱 버전</TableHead>
          <TableHead>IP 주소</TableHead>
          <TableHead>마지막 로그인</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device, index) => (
          <TableRow key={device.deviceId || index}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                {device.deviceType || 'UNKNOWN'}
              </div>
            </TableCell>
            <TableCell>{device.deviceModel || 'N/A'}</TableCell>
            <TableCell>{device.osVersion || 'N/A'}</TableCell>
            <TableCell>{device.appVersion || 'N/A'}</TableCell>
            <TableCell>{device.ipAddress || 'N/A'}</TableCell>
            <TableCell>
              {device.lastLoginTsp 
                ? new Date(device.lastLoginTsp).toLocaleString()
                : 'N/A'
              }
            </TableCell>
            <TableCell>
              <Badge variant={device.isActive ? 'default' : 'secondary'}>
                {device.isActive ? '활성' : '비활성'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// 활동 내역 테이블 컴포넌트  
function ActivityTable({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserActivities(userId);
        setActivities(data.content || []);
      } catch (error) {
        console.error('활동 내역 로딩 실패:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">로딩 중...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        활동 내역이 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>활동 유형</TableHead>
          <TableHead>설명</TableHead>
          <TableHead>추가 정보</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.slice(0, 15).map((activity, index) => (
          <TableRow key={activity.activityId || index}>
            <TableCell>
              {new Date(activity.activityTime).toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {activity.activityType === 'GAME_PARTICIPATION' ? '게임 참여' : 
                 activity.activityType === 'LOGIN' ? '로그인' :
                 activity.activityType === 'PURCHASE' ? '구매' : activity.activityType}
              </Badge>
            </TableCell>
            <TableCell>{activity.description}</TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {activity.additionalData}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
