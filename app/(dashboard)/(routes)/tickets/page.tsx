'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { 
  TicketIcon, 
  Plus,
  History,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  TrendingUp,
  Gift,
  Search,
  RefreshCw,
  Download
} from 'lucide-react';
import { adminIssueService } from '@/services/api';

interface TicketIssueHistory {
  issueId: number;
  userId: number;
  userName: string;
  amount: number;
  description: string;
  adminName: string;
  adminId: string;
  issuedAt: string;
  status: string;
}

interface TicketStats {
  totalIssued: number;
  totalIssuedToday: number;
  totalUsers: number;
  todayUsers: number;
}

export default function TicketsPage() {
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [ticketAmount, setTicketAmount] = useState('');
  const [issueReason, setIssueReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [issueHistory, setIssueHistory] = useState<TicketIssueHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [stats, setStats] = useState<TicketStats>({
    totalIssued: 0,
    totalIssuedToday: 0,
    totalUsers: 0,
    todayUsers: 0
  });

  // 티켓 지급 내역 로드
  const loadTicketHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = searchUserId ? { userId: searchUserId } : {};
      const response = await adminIssueService.getAllTicketHistory(params);
      setIssueHistory(response.content || []);
      
      // 통계 계산
      const today = new Date().toDateString();
      const todayHistory = response.content.filter((item: TicketIssueHistory) => 
        new Date(item.issuedAt).toDateString() === today
      );
      
      const uniqueUsers = new Set(response.content.map((item: TicketIssueHistory) => item.userId));
      const todayUniqueUsers = new Set(todayHistory.map((item: TicketIssueHistory) => item.userId));
      
      setStats({
        totalIssued: response.content.reduce((sum: number, item: TicketIssueHistory) => sum + item.amount, 0),
        totalIssuedToday: todayHistory.reduce((sum: number, item: TicketIssueHistory) => sum + item.amount, 0),
        totalUsers: uniqueUsers.size,
        todayUsers: todayUniqueUsers.size
      });
      
    } catch (error) {
      console.error('티켓 지급 내역 로딩 실패:', error);
      setIssueHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 컴포넌트 마운트 시 내역 로드
  useEffect(() => {
    loadTicketHistory();
  }, [searchUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTicketIssue = async () => {
    if (!targetUserId || !ticketAmount || !issueReason) {
      alert('사용자 ID, 티켓 수, 지급 사유를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      await adminIssueService.issueTickets({
        userId: parseInt(targetUserId),
        amount: parseInt(ticketAmount),
        description: issueReason
      });

      alert(`사용자 ID ${targetUserId}에게 티켓 ${ticketAmount}장이 지급되었습니다.`);
      
      // 폼 초기화
      setTargetUserId('');
      setTicketAmount('');
      setIssueReason('');
      setShowIssueDialog(false);
      
      // 내역 새로고침
      loadTicketHistory();
      
    } catch (error) {
      console.error('티켓 지급 실패:', error);
      alert('티켓 지급에 실패했습니다. 사용자 ID를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const exportHistory = () => {
    const csvData = issueHistory.map(item => ({
      '지급ID': item.issueId,
      '사용자ID': item.userId,
      '사용자명': item.userName,
      '티켓수': item.amount,
      '지급사유': item.description,
      '관리자': item.adminName,
      '지급시간': formatDate(item.issuedAt),
      '상태': item.status
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ticket_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-blue-600" />
            티켓 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            티켓 지급 및 사용 내역을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTicketHistory} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                티켓 지급
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>티켓 지급</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="targetUserId">대상 사용자 ID</Label>
                  <Input
                    id="targetUserId"
                    type="number"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="예: 12345"
                  />
                </div>
                <div>
                  <Label htmlFor="ticketAmount">지급할 티켓 수</Label>
                  <Input
                    id="ticketAmount"
                    type="number"
                    min="1"
                    value={ticketAmount}
                    onChange={(e) => setTicketAmount(e.target.value)}
                    placeholder="예: 10"
                  />
                </div>
                <div>
                  <Label htmlFor="issueReason">지급 사유</Label>
                  <Textarea
                    id="issueReason"
                    value={issueReason}
                    onChange={(e) => setIssueReason(e.target.value)}
                    placeholder="티켓 지급 사유를 입력해주세요"
                    rows={3}
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">주의사항</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    • 사용자 ID는 정확히 입력해주세요<br />
                    • 지급된 티켓은 즉시 반영됩니다<br />
                    • 지급 내역은 추적 가능합니다
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowIssueDialog(false)}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button 
                  onClick={handleTicketIssue}
                  disabled={loading || !targetUserId || !ticketAmount || !issueReason}
                >
                  {loading ? '지급 중...' : '지급하기'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 지급 티켓</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssued.toLocaleString()}장</div>
            <p className="text-xs text-muted-foreground">
              누적 지급량
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 지급</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssuedToday.toLocaleString()}장</div>
            <p className="text-xs text-muted-foreground">
              금일 지급량
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지급 받은 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">
              전체 대상자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 대상자</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayUsers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">
              금일 지급 대상
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">지급 내역</TabsTrigger>
          <TabsTrigger value="statistics">통계</TabsTrigger>
        </TabsList>

        {/* 지급 내역 탭 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  티켓 지급 내역
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="사용자 ID로 검색"
                      value={searchUserId}
                      onChange={(e) => setSearchUserId(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportHistory}>
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">지급 내역을 불러오는 중...</p>
                </div>
              ) : issueHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>티켓 지급 내역이 없습니다.</p>
                  <p className="text-sm">티켓을 지급하면 내역이 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      총 {issueHistory.length}건의 지급 내역
                    </p>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>지급 ID</TableHead>
                        <TableHead>사용자</TableHead>
                        <TableHead>티켓 수</TableHead>
                        <TableHead>지급 사유</TableHead>
                        <TableHead>처리자</TableHead>
                        <TableHead>지급 시간</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issueHistory.slice(0, 50).map((history) => (
                        <TableRow key={history.issueId}>
                          <TableCell className="font-mono text-sm">
                            #{history.issueId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{history.userName || `사용자${history.userId}`}</div>
                              <div className="text-sm text-muted-foreground">ID: {history.userId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <Gift className="w-3 h-3 mr-1" />
                              {history.amount.toLocaleString()}장
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate" title={history.description}>
                                {history.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {history.adminName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(history.issuedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              완료
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {issueHistory.length > 50 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        최근 50건만 표시됩니다. 전체 내역을 보려면 검색 필터를 사용하세요.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 통계 탭 */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>티켓 지급 통계 (개발 예정)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>상세 통계 기능이 곧 제공됩니다.</p>
                <p className="text-sm">일간/주간/월간 통계 및 차트가 추가될 예정입니다.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
