'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cog, Clock, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BatchPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Cog className="w-8 h-8" />
            배치 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            스케줄링 및 배치 작업을 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-10 h-10 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">배치 관리 페이지 개발 중</CardTitle>
          <p className="text-muted-foreground">배치 관리 기능이 곧 제공됩니다.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">⏰ 스케줄 관리</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 일일/주간/월간 배치</li>
                <li>• 자동 정산 작업</li>
                <li>• 데이터 백업 및 정리</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 작업 현황</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 실행 이력 및 로그</li>
                <li>• 성공/실패 모니터링</li>
                <li>• 성능 및 소요시간</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">개발 진행 상황</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">20% 완료</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
