'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DrawPrize, DrawPrizeUpdateRequest } from '@/services/drawService';
import { drawService } from '@/services/drawService';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import Link from 'next/link';

export default function EditDrawPrizePage({ params }: { params: Promise<{ drawId: string, prizeId: string }> }) {
  // React.use()로 params unwrap
  const unwrappedParams = use(params);
  const drawId = parseInt(unwrappedParams.drawId);
  const prizeId = parseInt(unwrappedParams.prizeId);
  
  const [prize, setPrize] = useState<DrawPrize | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // 폼 상태
  const [formData, setFormData] = useState({
    winningProbability: 0,
    displayProbability: '',
    winningPeriodDays: 0,
    totalWinningCount: 0,
    socialProofEnabled: false,
    pushEnabled: false
  });

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [winningProbabilityInput, setWinningProbabilityInput] = useState<string>('0');
  const [winningPeriodDaysInput, setWinningPeriodDaysInput] = useState<string>('0');
  const [totalWinningCountInput, setTotalWinningCountInput] = useState<string>('0');

  useEffect(() => {
    const fetchPrize = async () => {
      try {
        setLoading(true);
        const prizeData = await drawService.getDrawPrize(prizeId);
        console.log('상품 데이터:', prizeData);
        
        setPrize(prizeData);
        
        // 폼 데이터 초기화
        setFormData({
          winningProbability: prizeData.winningProbability,
          displayProbability: prizeData.displayProbability || '',
          winningPeriodDays: prizeData.winningPeriodDays,
          totalWinningCount: prizeData.totalWinningCount,
          socialProofEnabled: prizeData.socialProofEnabled,
          pushEnabled: prizeData.pushEnabled
        });
        
        // 로컬 상태 초기화
        setWinningProbabilityInput(prizeData.winningProbability.toString());
        setWinningPeriodDaysInput(prizeData.winningPeriodDays.toString());
        setTotalWinningCountInput(prizeData.totalWinningCount.toString());
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch prize:', err);
        setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrize();
  }, [prizeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // 업데이트 요청 데이터 준비
      const updateData: DrawPrizeUpdateRequest = {
        winningProbability: formData.winningProbability,
        displayProbability: formData.displayProbability || undefined,
        winningPeriodDays: formData.winningPeriodDays,
        totalWinningCount: formData.totalWinningCount,
        socialProofEnabled: formData.socialProofEnabled,
        pushEnabled: formData.pushEnabled
      };
      
      // API 호출
      const result = await drawService.updateDrawPrize(prizeId, updateData);
      console.log('업데이트 결과:', result);
      
      setSuccessMessage('상품 설정이 성공적으로 업데이트되었습니다.');
      
      // 3초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push(`/draws/${drawId}`);
      }, 2000);
      
    } catch (err: unknown) {
      console.error('Failed to update prize:', err);
      const errorMessage = err instanceof Error ? err.message : '상품 설정 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !prize) return <ErrorAlert message={error} />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4 flex items-center text-sm">
        <Link href="/draws" className="flex items-center text-primary hover:underline">
          <ArrowLeft size={16} className="mr-1" />
          뽑기 목록
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/draws/${drawId}`} className="text-primary hover:underline">
          {prize?.drawName || `뽑기 #${drawId}`}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600 dark:text-gray-300">
          {prize?.prizeName || `상품 #${prizeId}`} 편집
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          상품 설정 편집
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {prize?.prizeName} ({prize?.prizeBrand})의 당첨 확률과 설정을 변경할 수 있습니다.
        </p>
      </div>

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 당첨 확률 */}
            <div>
              <label htmlFor="winningProbability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                당첨 확률 (%)
              </label>
              <input
                type="number"
                id="winningProbability"
                name="winningProbability"
                value={winningProbabilityInput}
                onChange={(e) => setWinningProbabilityInput(e.target.value)}
                onFocus={(e) => {
                  // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                  if (e.target.value === '0' || e.target.value === '0.00') {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  const numValue = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, winningProbability: numValue }));
                  setWinningProbabilityInput(numValue.toString());
                }}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                실제 당첨에 사용되는 확률입니다. (0.01 단위로 입력 가능)
              </p>
            </div>

            {/* 표시 확률 */}
            <div>
              <label htmlFor="displayProbability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                표시 확률
              </label>
              <input
                type="text"
                id="displayProbability"
                name="displayProbability"
                value={formData.displayProbability}
                onChange={handleInputChange}
                placeholder="예: 1/1000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                사용자에게 표시될 확률입니다. 빈 값일 경우 실제 확률이 표시됩니다.
              </p>
            </div>

            {/* 당첨 기간 */}
            <div>
              <label htmlFor="winningPeriodDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                당첨 기간 (일)
              </label>
              <input
                type="number"
                id="winningPeriodDays"
                name="winningPeriodDays"
                value={winningPeriodDaysInput}
                onChange={(e) => setWinningPeriodDaysInput(e.target.value)}
                onFocus={(e) => {
                  // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                  if (e.target.value === '1' || e.target.value === '0') {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  const numValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, winningPeriodDays: numValue }));
                  setWinningPeriodDaysInput(numValue.toString());
                }}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                당첨된 상품의 사용 가능 기간입니다.
              </p>
            </div>

            {/* 총 당첨 수량 */}
            <div>
              <label htmlFor="totalWinningCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                총 당첨 수량
              </label>
              <input
                type="number"
                id="totalWinningCount"
                name="totalWinningCount"
                value={totalWinningCountInput}
                onChange={(e) => setTotalWinningCountInput(e.target.value)}
                onFocus={(e) => {
                  // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                  if (e.target.value === '1' || e.target.value === '0') {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  const numValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, totalWinningCount: numValue }));
                  setTotalWinningCountInput(numValue.toString());
                }}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                이 상품의 총 당첨 가능 수량입니다.
              </p>
            </div>
          </div>

          {/* 체크박스 옵션들 */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="socialProofEnabled"
                name="socialProofEnabled"
                checked={formData.socialProofEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="socialProofEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                소셜 프루프 활성화
              </label>
            </div>
            <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">
              다른 사용자들에게 이 상품의 당첨 알림을 표시합니다.
            </p>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="pushEnabled"
                name="pushEnabled"
                checked={formData.pushEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="pushEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                푸시 알림 활성화
              </label>
            </div>
            <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">
              이 상품 당첨 시 푸시 알림을 발송합니다.
            </p>
          </div>

          {/* 현재 상품 정보 표시 */}
          {prize && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">현재 상품 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">상품 ID:</span>
                  <p className="font-medium">{prize.id}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">상품명:</span>
                  <p className="font-medium">{prize.prizeName}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">브랜드:</span>
                  <p className="font-medium">{prize.prizeBrand}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">타입:</span>
                  <p className="font-medium">{prize.prizeType}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">남은 수량:</span>
                  <p className="font-medium">{prize.remainingCount}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">당첨 시작일:</span>
                  <p className="font-medium">{prize.winningStartDate}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">상태:</span>
                  <p className="font-medium">{prize.state === 1 ? '활성' : '비활성'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/draws/${drawId}`)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-2" />
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
