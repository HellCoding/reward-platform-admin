'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            이벤트 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            게임 이벤트 및 프로모션을 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">이벤트 관리 페이지 개발 중</CardTitle>
          <p className="text-muted-foreground">이벤트 관리 기능이 곧 제공됩니다.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">🎊 이벤트 생성</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 게임별 이벤트 설정</li>
                <li>• 보상 배율 조정</li>
                <li>• 기간 및 조건 설정</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 이벤트 현황</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 진행 중/예정/종료 이벤트</li>
                <li>• 참여율 및 효과 분석</li>
                <li>• 이벤트별 통계</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">개발 진행 상황</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">30% 완료</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
