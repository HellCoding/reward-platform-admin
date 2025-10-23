'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Gift, 
  CreditCard, 
  Plus,
  History,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { adminIssueService } from '@/services/api';

interface AdminIssueManagementProps {
  userId: string;
  userName: string;
}

interface IssueHistory {
  issueId: number;
  userId: number;
  userName: string;
  issueType: 'TICKET' | 'POINT';
  amount: number;
  description: string;
  adminName: string;
  adminId: string;
  issuedAt: string;
  status: string;
}

export default function AdminIssueManagement({ userId, userName }: AdminIssueManagementProps) {
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showPointDialog, setShowPointDialog] = useState(false);
  const [ticketAmount, setTicketAmount] = useState('');
  const [pointAmount, setPointAmount] = useState('');
  const [ticketReason, setTicketReason] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [issueHistory, setIssueHistory] = useState<IssueHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 지급 내역 로드
  const loadIssueHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await adminIssueService.getUserAllIssueHistory(parseInt(userId));
      setIssueHistory(response.content || []);
    } catch (error) {
      console.error('지급 내역 로딩 실패:', error);
      setIssueHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 컴포넌트 마운트 시 지급 내역 로드
  React.useEffect(() => {
    if (userId) {
      loadIssueHistory();
    }
  }, [userId]);

  const handleTicketIssue = async () => {
    if (!ticketAmount || !ticketReason) {
      alert('티켓 수와 지급 사유를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      await adminIssueService.issueTickets({
        userId: parseInt(userId),
        amount: parseInt(ticketAmount),
        description: ticketReason
      });

      alert(`${userName}님에게 티켓 ${ticketAmount}장이 지급되었습니다.`);
      
      // 폼 초기화
      setTicketAmount('');
      setTicketReason('');
      setShowTicketDialog(false);
      
      // 지급 내역 새로고침
      loadIssueHistory();
      
    } catch (error) {
      console.error('티켓 지급 실패:', error);
      alert('티켓 지급에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handlePointIssue = async () => {
    if (!pointAmount || !pointReason) {
      alert('포인트와 지급 사유를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      await adminIssueService.issuePoints({
        userId: parseInt(userId),
        amount: parseInt(pointAmount),
        description: pointReason
      });

      alert(`${userName}님에게 포인트 ${parseInt(pointAmount).toLocaleString()}P가 지급되었습니다.`);
      
      // 폼 초기화
      setPointAmount('');
      setPointReason('');
      setShowPointDialog(false);
      
      // 지급 내역 새로고침
      loadIssueHistory();
      
    } catch (error) {
      console.error('포인트 지급 실패:', error);
      alert('포인트 지급에 실패했습니다. 다시 시도해주세요.');
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

  return (
    <div className="space-y-6">
      {/* 지급 액션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 티켓 지급 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-600" />
              티켓 지급
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {userName}님에게 티켓을 수동으로 지급합니다.
            </p>
            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  티켓 지급하기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>티켓 지급</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                    <Label htmlFor="ticketReason">지급 사유</Label>
                    <Textarea
                      id="ticketReason"
                      value={ticketReason}
                      onChange={(e) => setTicketReason(e.target.value)}
                      placeholder="티켓 지급 사유를 입력해주세요"
                      rows={3}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">지급 정보</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      대상: {userName} (ID: {userId})<br />
                      관리자: 현재 로그인된 관리자<br />
                      지급 시간: 즉시 반영
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTicketDialog(false)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handleTicketIssue}
                    disabled={loading || !ticketAmount || !ticketReason}
                  >
                    {loading ? '지급 중...' : '지급하기'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 포인트 지급 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              포인트 지급
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {userName}님에게 포인트를 수동으로 지급합니다.
            </p>
            <Dialog open={showPointDialog} onOpenChange={setShowPointDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  포인트 지급하기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>포인트 지급</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pointAmount">지급할 포인트</Label>
                    <Input
                      id="pointAmount"
                      type="number"
                      min="1"
                      value={pointAmount}
                      onChange={(e) => setPointAmount(e.target.value)}
                      placeholder="예: 10000"
                    />
                    {pointAmount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {parseInt(pointAmount).toLocaleString()}P
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pointReason">지급 사유</Label>
                    <Textarea
                      id="pointReason"
                      value={pointReason}
                      onChange={(e) => setPointReason(e.target.value)}
                      placeholder="포인트 지급 사유를 입력해주세요"
                      rows={3}
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">지급 정보</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      대상: {userName} (ID: {userId})<br />
                      관리자: 현재 로그인된 관리자<br />
                      지급 시간: 즉시 반영
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPointDialog(false)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handlePointIssue}
                    disabled={loading || !pointAmount || !pointReason}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? '지급 중...' : '지급하기'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 지급 내역 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            관리자 지급 내역
          </CardTitle>
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
              <p>관리자 지급 내역이 없습니다.</p>
              <p className="text-sm">티켓이나 포인트를 지급하면 내역이 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {issueHistory.length}건의 지급 내역
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadIssueHistory}
                  disabled={historyLoading}
                >
                  새로고침
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>타입</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>처리자</TableHead>
                    <TableHead>지급 시간</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issueHistory.slice(0, 10).map((history) => (
                    <TableRow key={history.issueId}>
                      <TableCell>
                        <Badge variant={history.issueType === 'TICKET' ? 'default' : 'secondary'}>
                          {history.issueType === 'TICKET' ? (
                            <>
                              <Gift className="w-3 h-3 mr-1" />
                              티켓
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3 mr-1" />
                              포인트
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {history.amount.toLocaleString()}
                        {history.issueType === 'TICKET' ? '장' : 'P'}
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

              {issueHistory.length > 10 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    최근 10건만 표시됩니다. 전체 내역은 별도 관리 페이지에서 확인하세요.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
