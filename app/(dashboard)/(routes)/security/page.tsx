"use client";

import { useEffect, useState } from "react";
import { Shield, Server, Users, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminSecurityService } from "@/services/admin-security-service";

interface SecurityStatus {
  ipFilterEnabled: boolean;
  currentIP: string;
  allowedIPsCount: number;
  allowedIPRangesCount: number;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  loginDetectionEnabled: boolean;
  timestamp: string;
}

interface SessionStats {
  totalActiveSessions: number;
  adminSessions: number;
  userSessions: number;
  timestamp: string;
}

export default function SecurityPage() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusData, statsData] = await Promise.all([
        adminSecurityService.getSecurityStatus(),
        adminSecurityService.getSessionStats()
      ]);
      
      setSecurityStatus(statusData);
      setSessionStats(statsData);
      setError(null);
    } catch (error) {
      console.error('보안 데이터 조회 실패:', error);
      setError('보안 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보안 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">
            시스템 보안 상태 및 관리자 세션 모니터링
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 보안 상태 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IP 필터</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={securityStatus?.ipFilterEnabled ? "default" : "secondary"}>
                    {securityStatus?.ipFilterEnabled ? "활성" : "비활성"}
                  </Badge>
                  {securityStatus?.ipFilterEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">현재 IP</p>
                <p className="text-lg font-semibold font-mono">
                  {securityStatus?.currentIP}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 세션</p>
                <p className="text-lg font-semibold">
                  {sessionStats?.adminSessions || 0}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">세션 제한</p>
                <p className="text-lg font-semibold">
                  최대 {securityStatus?.maxConcurrentSessions}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 기반 상세 정보 */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">보안 상태</TabsTrigger>
          <TabsTrigger value="ip-settings">IP 설정</TabsTrigger>
          <TabsTrigger value="sessions">세션 관리</TabsTrigger>
          <TabsTrigger value="activity">활동 로그</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>IP 보안 설정</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">IP 필터 활성화</span>
                  <Badge variant={securityStatus?.ipFilterEnabled ? "default" : "secondary"}>
                    {securityStatus?.ipFilterEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">허용된 IP 개수</span>
                  <span className="font-semibold">{securityStatus?.allowedIPsCount}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">허용된 IP 범위</span>
                  <span className="font-semibold">{securityStatus?.allowedIPRangesCount}개</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>세션 관리</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">세션 타임아웃</span>
                  <span className="font-semibold">{securityStatus?.sessionTimeoutMinutes}분</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">최대 동시 세션</span>
                  <span className="font-semibold">{securityStatus?.maxConcurrentSessions}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">현재 관리자 세션</span>
                  <span className="font-semibold">{sessionStats?.adminSessions}개</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ip-settings">
          <Card>
            <CardHeader>
              <CardTitle>IP 화이트리스트 관리</CardTitle>
              <CardDescription>
                관리자 패널에 접근할 수 있는 IP 주소를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                IP 설정 기능은 개발 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>활성 세션 관리</CardTitle>
              <CardDescription>
                현재 활성화된 관리자 세션을 조회하고 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                세션 관리 기능은 개발 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>관리자 활동 로그</CardTitle>
              <CardDescription>
                관리자의 모든 활동을 추적하고 기록합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                활동 로그 기능은 개발 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 최근 업데이트 시간 */}
      {securityStatus && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          마지막 업데이트: {new Date(securityStatus.timestamp).toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );
}