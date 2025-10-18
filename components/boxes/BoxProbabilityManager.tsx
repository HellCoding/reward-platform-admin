'use client';

import { useState, useEffect } from 'react';
import { X, Save, Settings, AlertCircle } from 'lucide-react';

interface PointRange {
  prizeId: number;
  prizeName: string;
  minValue: number | null;
  maxValue: number | null;
  isConfigured: boolean;
}

interface RandomBoxPrize {
  id: number;
  prizeId: number;
  prizeName: string;
  prizeBrand: string;
  prizeType: string;
  winningProbability: number;
  displayProbability: number;
  remainingCount: number;
  totalWinningCount: number;
  winningPeriodDays: number;
  winningStartDate: string;
  nextRestockDate?: string;
  socialProofEnabled: boolean;
  pushEnabled: boolean;
  state: number;
}

interface BoxProbabilityManagerProps {
  boxId: string;
  prizes: RandomBoxPrize[];
  pointRanges?: PointRange[];
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BoxProbabilityManager({ boxId, prizes, pointRanges = [], onClose, onSuccess }: BoxProbabilityManagerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 각 상품의 확률을 관리하는 상태 (로컬 문자열 상태)
  const [probabilityInputs, setProbabilityInputs] = useState<{ [key: number]: string }>({});
  const [probabilities, setProbabilities] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // 초기 확률 설정
    const initialProbabilities: { [key: number]: number } = {};
    const initialInputs: { [key: number]: string } = {};
    
    prizes.forEach(prize => {
      initialProbabilities[prize.id] = prize.winningProbability;
      initialInputs[prize.id] = prize.winningProbability.toString();
    });
    
    setProbabilities(initialProbabilities);
    setProbabilityInputs(initialInputs);
  }, [prizes]);

  // 총 확률 계산
  const totalProbability = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
  const isValidTotal = Math.abs(totalProbability - 100) < 0.1;

  const handleProbabilityChange = (prizeId: number, inputValue: string) => {
    setProbabilityInputs(prev => ({
      ...prev,
      [prizeId]: inputValue
    }));
  };

  const handleProbabilityBlur = (prizeId: number, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
    setProbabilities(prev => ({
      ...prev,
      [prizeId]: numValue
    }));
    setProbabilityInputs(prev => ({
      ...prev,
      [prizeId]: numValue.toString()
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!isValidTotal) {
        setError('총 확률이 100%가 되어야 합니다.');
        return;
      }

      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // 확률 업데이트 요청
      const updates = Object.entries(probabilities).map(([prizeId, probability]) => ({
        prizeId: parseInt(prizeId),
        winningProbability: probability
      }));

      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/probabilities`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('확률 업데이트에 실패했습니다.');
      }

      setSuccess('확률이 성공적으로 업데이트되었습니다.');
      
      // 성공 후 콜백 실행
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to update probabilities:', err);
      setError(err instanceof Error ? err.message : '확률 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                확률 일괄 관리
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 총 확률 표시 */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            isValidTotal 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle size={20} className={isValidTotal ? 'text-green-600' : 'text-red-600'} />
                <span className={`font-medium ${isValidTotal ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  총 확률: {totalProbability.toFixed(1)}%
                </span>
              </div>
              <span className={`text-sm ${isValidTotal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isValidTotal ? '✓ 유효함' : '✗ 총 확률이 100%가 되어야 합니다'}
              </span>
            </div>
          </div>

          {/* 상품별 확률 설정 */}
          <div className="space-y-4">
            {/* 확률 높은순으로 정렬 */}
            {[...prizes]
              .sort((a, b) => b.winningProbability - a.winningProbability)
              .map((prize) => (
              <div key={prize.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {prize.prizeName}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {prize.prizeBrand} • {prize.prizeType}
                      {/* 기본 포인트류인 경우 포인트 범위 표시 */}
                      {(prize.prizeName.includes('기본 포인트') || prize.prizeType === 'BASIC_POINT') && (() => {
                        const pointRange = pointRanges.find(range => range.prizeName === prize.prizeName);
                        if (pointRange && pointRange.isConfigured) {
                          return (
                            <>
                              <br />
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                                💰 {pointRange.minValue || 0}P ~ {pointRange.maxValue || 0}P
                              </span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <br />
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mt-1">
                                ⚠️ 포인트 범위 미설정
                              </span>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        당첨률:
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={probabilityInputs[prize.id] || ''}
                        onChange={(e) => handleProbabilityChange(prize.id, e.target.value)}
                        onFocus={(e) => {
                          if (e.target.value === '0' || e.target.value === '0.0') {
                            e.target.select();
                          }
                        }}
                        onBlur={(e) => handleProbabilityBlur(prize.id, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 에러/성공 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValidTotal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                saving || !isValidTotal
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
}
