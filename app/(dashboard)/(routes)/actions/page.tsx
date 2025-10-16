'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Gamepad2, 
  Activity, 
  Settings, 
  Users, 
  TrendingUp,
  BarChart3,
  Ticket,
  Eye,
  EyeOff,
  MonitorPlay,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { actionService, AdminActionDTO, AdminActionStatisticsDTO } from '@/services/actionService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function ActionsPage() {
  const router = useRouter();
  const [actions, setActions] = useState<AdminActionDTO[]>([]);
  const [statistics, setStatistics] = useState<AdminActionStatisticsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [actionsData, statisticsData] = await Promise.all([
        actionService.getAllActions(),
        actionService.getActionStatistics(7)
      ]);
      
      setActions(actionsData);
      setStatistics(statisticsData);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (actionId: number) => {
    try {
      setToggleLoading(actionId);
      const updatedAction = await actionService.toggleActionActive(actionId);
      
      setActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? updatedAction 
            : action
        )
      );
    } catch (err) {
      setError('액션 상태 변경에 실패했습니다.');
      console.error('Failed to toggle action:', err);
    } finally {
      setToggleLoading(null);
    }
  };

  const getActionStatistics = (actionId: number) => {
    return statistics.find(stat => stat.actionId === actionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gamepad2 className="w-8 h-8" />
            액션 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            게임 액션 및 설정을 관리합니다. (쿠팡 파트너스 제외)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            새로고침
          </Button>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              활성 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actions.filter(a => a.isActive).length}개
            </div>
            <p className="text-xs text-muted-foreground">
              전체 {actions.length}개 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              오늘 참여자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actions.reduce((sum, action) => sum + action.todayUniqueUsers, 0)}명
            </div>
            <p className="text-xs text-muted-foreground">
              고유 사용자 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              오늘 참여 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actions.reduce((sum, action) => sum + action.todayParticipations, 0)}회
            </div>
            <p className="text-xs text-muted-foreground">
              총 게임 참여
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-orange-500" />
              7일 티켓 발행
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.reduce((sum, stat) => sum + stat.totalTicketsEarned, 0)}장
            </div>
            <p className="text-xs text-muted-foreground">
              최근 7일간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 액션 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {actions.map((action) => {
          const stats = getActionStatistics(action.id);
          return (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      {action.actionName}
                    </CardTitle>
                    <Badge variant={action.isActive ? "default" : "secondary"}>
                      {action.activeStatusKorean}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.isActive ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <Switch
                      checked={action.isActive}
                      onCheckedChange={() => handleToggleActive(action.id)}
                      disabled={toggleLoading === action.id}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.actionTypeKorean} • 순서: {action.ord}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 기본 설정 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">보상 설정</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">성공 시:</span>
                        <span>{action.successReward}장</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">실패 시:</span>
                        <span>{action.failReward}장</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">제한 설정</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">일일 제한:</span>
                        <span>{action.dailyLimit}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">최대 보상:</span>
                        <span>{action.maxDailyReward}장</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오늘 통계 */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    오늘 현황
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">참여 횟수:</span>
                      <span className="font-medium">{action.todayParticipations}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">참여자 수:</span>
                      <span className="font-medium">{action.todayUniqueUsers}명</span>
                    </div>
                  </div>
                </div>

                {/* 7일 통계 */}
                {stats && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      최근 7일
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">총 참여:</span>
                        <span className="font-medium">{stats.participationCount}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">참여자 수:</span>
                        <span className="font-medium">{stats.uniqueUsers}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">티켓 발행:</span>
                        <span className="font-medium">{stats.totalTicketsEarned}장</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">평균 참여:</span>
                        <span className="font-medium">{stats.averageParticipationRate.toFixed(1)}회/명</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 광고 추가 기회 설정 */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MonitorPlay className="w-4 h-4" />
                    광고 추가 기회
                  </h4>
                  {action.adConfig ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">일일 광고 제한:</span>
                          <span className="font-medium">{action.adConfig.dailyLimit}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">광고당 기회:</span>
                          <span className="font-medium">{action.adConfig.additionalChances}회</span>
                        </div>
                      </div>
                      {action.adStatistics && (
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">오늘 광고 시청:</span>
                            <span className="font-medium">{action.adStatistics.todayAdWatches}회</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">추가 기회 사용:</span>
                            <span className="font-medium">{action.adStatistics.todayExtraChancesUsed}회</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={action.adConfig.isActive ? "default" : "secondary"} className="text-xs">
                          {action.adConfig.isActive ? "활성화" : "비활성화"}
                        </Badge>
                        {action.adStatistics && action.adStatistics.adConversionRate > 0 && (
                          <span className="text-xs text-muted-foreground">
                            전환율: {action.adStatistics.adConversionRate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="w-3 h-3" />
                      <span>광고 설정이 없습니다</span>
                    </div>
                  )}
                </div>

                {/* 액션별 설정 링크 */}
                <div className="border-t pt-3">
                  <Link 
                    href={`/actions/manage/${action.id}`}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Settings className="w-4 h-4" />
                    상세 설정 관리
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 쿠팡 파트너스 링크 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            쿠팡 파트너스 관리
          </CardTitle>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            쿠팡 파트너스는 별도 관리 페이지에서 관리됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/actions/coupang-partners">
            <Button className="bg-blue-600 hover:bg-blue-700">
              쿠팡 파트너스 관리 페이지로 이동
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
