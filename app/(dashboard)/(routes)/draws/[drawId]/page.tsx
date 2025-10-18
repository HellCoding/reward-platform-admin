'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DrawPrize, Draw } from '@/services/drawService';
import { drawService } from '@/services/drawService';
import { ArrowLeft, Edit, BarChart2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import Link from 'next/link';
import ProbabilityManager from '@/components/draws/ProbabilityManager';

export default function DrawPrizesPage({ params }: { params: Promise<{ drawId: string }> }) {
  // React.use()로 params unwrap
  const unwrappedParams = use(params);
  const drawId = parseInt(unwrappedParams.drawId);
  
  const [prizes, setPrizes] = useState<DrawPrize[]>([]);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProbabilityManager, setShowProbabilityManager] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 뽑기 상품 목록 가져오기
        const prizesData = await drawService.getPrizesByDrawId(drawId);
        console.log('상품 목록 데이터:', prizesData);
        
        // 응답이 배열인지 확인하고 설정
        const prizesList = Array.isArray(prizesData) ? prizesData : [];
        setPrizes(prizesList);
        
        // 뽑기 정보 가져오기
        if (prizesList.length > 0) {
          // 첫 번째 상품에서 뽑기 정보 추출
          setDraw({
            id: prizesList[0].drawId,
            name: prizesList[0].drawName,
            description: '',
            pointCost: 0,
            drawType: '',
            imageUrl: '',
            isActive: true
          });
        } else {
          try {
            // 상품이 없는 경우 뽑기 정보 별도 조회 필요
            const draws = await drawService.getAllDraws();
            console.log('모든 뽑기 목록:', draws);
            
            if (Array.isArray(draws)) {
              const currentDraw = draws.find(d => d.id === drawId);
              if (currentDraw) {
                setDraw(currentDraw);
              }
            }
          } catch (err) {
            console.error('뽑기 정보 로드 실패:', err);
          }
        }
        
        // 확률 합계는 확률 일괄 관리 모달에서만 확인
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch draw prizes:', err);
        setError('뽑기 상품 목록을 불러오는 중 오류가 발생했습니다.');
        setPrizes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [drawId]);

  const handleEditPrize = (prizeId: number) => {
    router.push(`/draws/${drawId}/prize/${prizeId}`);
  };

  const formatProbability = (probability: number) => {
    // 이미 퍼센트 값이므로 그대로 표시
    return `${probability.toFixed(2)}%`;
  };

  // 확률 관리자 열기
  const openProbabilityManager = () => {
    setShowProbabilityManager(true);
  };

  // 확률 관리자 닫기
  const closeProbabilityManager = () => {
    setShowProbabilityManager(false);
  };

  // 확률 업데이트 성공 후 처리
  const handleProbabilityUpdateSuccess = async () => {
    // 확률 관리자 닫기
    setShowProbabilityManager(false);
    
    // 데이터 새로고침
    try {
      const prizesData = await drawService.getPrizesByDrawId(drawId);
      setPrizes(Array.isArray(prizesData) ? prizesData : []);
    } catch (err) {
      console.error('데이터 새로고침 실패:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4 flex items-center text-sm">
        <Link href="/draws" className="flex items-center text-primary hover:underline">
          <ArrowLeft size={16} className="mr-1" />
          뽑기 목록
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600 dark:text-gray-300">{draw?.name || `뽑기 #${drawId}`}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {draw?.name || `뽑기 #${drawId}`} 상품 관리
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            뽑기에 포함된 상품 목록과 확률 설정입니다. 수정 버튼을 클릭하여 개별 상품의 확률과 당첨 설정을 변경할 수 있습니다.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            onClick={openProbabilityManager}
          >
            <BarChart2 size={16} className="mr-2" />
            확률 일괄 관리
          </button>
        </div>
      </div>

      {/* 경고 메시지 제거 - 확률 일괄 관리 모달에서 확인 가능하므로 불필요 */}

      {/* 확률 관리자 모달 */}
      {showProbabilityManager && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <ProbabilityManager 
              drawId={drawId} 
              onClose={closeProbabilityManager}
              onSuccess={handleProbabilityUpdateSuccess}
            />
          </div>
        </div>
      )}

      {prizes.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300">등록된 상품이 없습니다.</h2>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">상품명</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">브랜드</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">타입</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">당첨 확률</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">표시 확률</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">당첨 기간(일)</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">총 수량</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">남은 수량</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">소셜 프루프</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">푸시 알림</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {prizes.map((prize) => (
                <tr key={prize.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{prize.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{prize.prizeName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{prize.prizeBrand}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prize.prizeType === 'GIFTICON' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                        : prize.prizeType === 'POINT'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {prize.prizeType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{formatProbability(prize.winningProbability)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{prize.displayProbability || formatProbability(prize.winningProbability)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{prize.winningPeriodDays}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{prize.totalWinningCount}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{prize.remainingCount}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prize.socialProofEnabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {prize.socialProofEnabled ? '활성화' : '비활성화'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prize.pushEnabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {prize.pushEnabled ? '활성화' : '비활성화'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button 
                      onClick={() => handleEditPrize(prize.id)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      title="상품 설정 편집"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}