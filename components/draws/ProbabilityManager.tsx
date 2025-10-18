'use client';

import { useState, useEffect } from 'react';
import { DrawPrize, ProbabilityUpdateRequest, drawService } from '@/services/drawService';
import { X, Save } from 'lucide-react';

interface ProbabilityManagerProps {
  drawId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProbabilityManager({ drawId, onClose, onSuccess }: ProbabilityManagerProps) {
  const [prizes, setPrizes] = useState<DrawPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 각 상품의 확률을 관리하는 상태
  const [probabilities, setProbabilities] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        setLoading(true);
        const prizesData = await drawService.getPrizesByDrawId(drawId);
        
        if (Array.isArray(prizesData)) {
          setPrizes(prizesData);
          
          // 초기 확률 설정
          const initialProbabilities: { [key: number]: number } = {};
          prizesData.forEach(prize => {
            initialProbabilities[prize.id] = prize.winningProbability;
          });
          setProbabilities(initialProbabilities);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch prizes:', err);
        setError('상품 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrizes();
  }, [drawId]);

  // 확률 변경 핸들러
  const handleProbabilityChange = (prizeId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProbabilities(prev => ({
      ...prev,
      [prizeId]: numValue
    }));
  };

  // 확률 합계 계산
  const calculateTotalProbability = () => {
    return Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
  };

  // 확률 업데이트 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // 업데이트 요청 데이터 준비
      const updates: ProbabilityUpdateRequest[] = prizes.map(prize => ({
        id: prize.id,
        winningProbability: probabilities[prize.id] || 0
      }));

      // API 호출
      await drawService.updateProbabilities(drawId, updates);
      
      setSuccess('확률이 성공적으로 업데이트되었습니다.');
      
      // 3초 후 성공 메시지 숨김
      setTimeout(() => {
        setSuccess(null);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err: unknown) {
      console.error('Failed to update probabilities:', err);
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : '확률 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage || '확률 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 확률 초기화
  const resetProbabilities = () => {
    const initialProbabilities: { [key: number]: number } = {};
    prizes.forEach(prize => {
      initialProbabilities[prize.id] = prize.winningProbability;
    });
    setProbabilities(initialProbabilities);
  };

  const totalProbability = calculateTotalProbability();
  const isValidTotal = Math.abs(totalProbability - 100) < 0.01;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">확률 일괄 관리</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
          {success}
        </div>
      )}

      {/* 확률 합계 표시 */}
      <div className={`mb-6 p-4 rounded-lg ${
        isValidTotal 
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">확률 합계: {totalProbability.toFixed(2)}%</span>
          {isValidTotal ? (
            <span className="text-sm">✓ 올바른 합계 (100%)</span>
          ) : (
            <span className="text-sm">⚠ 합계가 100%가 아닙니다</span>
          )}
        </div>
      </div>

      {/* 상품 목록 및 확률 입력 */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {prizes.map((prize) => (
          <div key={prize.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900 dark:text-white">{prize.prizeName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{prize.prizeBrand} - {prize.prizeType}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">확률 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={probabilities[prize.id] || 0}
                    onChange={(e) => handleProbabilityChange(prize.id, e.target.value)}
                    onFocus={(e) => {
                      // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                      if (e.target.value === '0' || e.target.value === '0.00') {
                        e.target.select();
                      }
                    }}
                    onBlur={(e) => {
                      // blur 시 빈 값이면 0으로 설정 (확률은 0일 수 있음)
                      if (e.target.value === '') {
                        e.target.value = '0';
                        handleProbabilityChange(prize.id, '0');
                      }
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 버튼 영역 - 스타일 개선 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={resetProbabilities}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 font-medium"
        >
          초기화
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium min-w-[100px] justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}