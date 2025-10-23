'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Clock, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" />
            설정
          </h1>
          <p className="text-muted-foreground mt-1">
            시스템 설정 및 환경 구성을 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-10 h-10 text-gray-600" />
          </div>
          <CardTitle className="text-2xl">설정 페이지 개발 중</CardTitle>
          <p className="text-muted-foreground">시스템 설정 기능이 곧 제공됩니다.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">⚙️ 시스템 설정</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 게임 파라미터 설정</li>
                <li>• 보상 및 확률 조정</li>
                <li>• 제한 및 규칙 관리</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔧 운영 설정</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 관리자 권한 관리</li>
                <li>• 알림 및 로그 설정</li>
                <li>• 백업 및 보안 설정</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">개발 진행 상황</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-600 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">15% 완료</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
