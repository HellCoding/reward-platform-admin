'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            페이지 준비 중
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            요청하신 페이지는 현재 개발 중입니다.
          </p>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800 dark:text-blue-300">개발 진행 현황</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <div className="text-green-600 dark:text-green-400">✅ 완료</div>
                <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 대시보드</li>
                  <li>• 사용자 관리</li>
                  <li>• 뽑기 관리</li>
                  <li>• Daily Report</li>
                </ul>
              </div>
              <div className="text-left">
                <div className="text-yellow-600 dark:text-yellow-400">🚧 개발 중</div>
                <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 이벤트 관리</li>
                  <li>• 포인트 관리</li>
                  <li>• 티켓 관리</li>
                  <li>• 상품 관리</li>
                  <li>• 배치 관리</li>
                  <li>• 설정</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center"
            >
              대시보드로 이동
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
            <p>개발 완료 예정일: 추후 공지</p>
            <p>문의사항이 있으시면 개발팀에 연락해 주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
