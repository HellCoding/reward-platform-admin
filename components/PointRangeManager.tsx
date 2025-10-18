"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";

interface PointRange {
  prizeId: number;
  prizeName: string;
  minValue: number | null;
  maxValue: number | null;
  isConfigured: boolean;
}

interface PointRangeManagerProps {
  boxId: string;
  boxType: string;
}

export default function PointRangeManager({ boxId, boxType }: PointRangeManagerProps) {
  const [pointRanges, setPointRanges] = useState<PointRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 편집 상태
  const [pointAMin, setPointAMin] = useState<number>(1);
  const [pointAMax, setPointAMax] = useState<number>(2);
  const [pointBMin, setPointBMin] = useState<number>(3);
  const [pointBMax, setPointBMax] = useState<number>(5);
  const [pointCMin, setPointCMin] = useState<number>(6);
  const [pointCMax, setPointCMax] = useState<number>(8);

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [pointAMinInput, setPointAMinInput] = useState<string>('1');
  const [pointAMaxInput, setPointAMaxInput] = useState<string>('2');
  const [pointBMinInput, setPointBMinInput] = useState<string>('3');
  const [pointBMaxInput, setPointBMaxInput] = useState<string>('5');
  const [pointCMinInput, setPointCMinInput] = useState<string>('6');
  const [pointCMaxInput, setPointCMaxInput] = useState<string>('8');

  const fetchPointRanges = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/point-ranges`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("포인트 범위를 불러오는데 실패했습니다.");
      }

      const data: PointRange[] = await response.json();
      setPointRanges(data);

      // 기존 설정값으로 초기화
      data.forEach(range => {
        if (range.prizeName === "기본 포인트 A" && range.isConfigured) {
          const minVal = range.minValue || 1;
          const maxVal = range.maxValue || 2;
          setPointAMin(minVal);
          setPointAMax(maxVal);
          setPointAMinInput(minVal.toString());
          setPointAMaxInput(maxVal.toString());
        } else if (range.prizeName === "기본 포인트 B" && range.isConfigured) {
          const minVal = range.minValue || 3;
          const maxVal = range.maxValue || 5;
          setPointBMin(minVal);
          setPointBMax(maxVal);
          setPointBMinInput(minVal.toString());
          setPointBMaxInput(maxVal.toString());
        } else if (range.prizeName === "기본 포인트 C" && range.isConfigured) {
          const minVal = range.minValue || 6;
          const maxVal = range.maxValue || 8;
          setPointCMin(minVal);
          setPointCMax(maxVal);
          setPointCMinInput(minVal.toString());
          setPointCMaxInput(maxVal.toString());
        }
      });

    } catch (error) {
      console.error("포인트 범위 조회 실패:", error);
      alert("포인트 범위를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [boxId]);

  const handleBulkUpdate = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/point-ranges/bulk`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boxType: boxType,
          pointAMin: pointAMin,
          pointAMax: pointAMax,
          pointBMin: pointBMin,
          pointBMax: pointBMax,
          pointCMin: pointCMin,
          pointCMax: pointCMax,
        }),
      });

      if (!response.ok) {
        throw new Error("포인트 범위 업데이트에 실패했습니다.");
      }

      alert("포인트 범위가 성공적으로 업데이트되었습니다!");
      setEditMode(false);
      fetchPointRanges(); // 새로고침

    } catch (error) {
      console.error("포인트 범위 업데이트 실패:", error);
      alert("포인트 범위 업데이트에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPointRanges();
  }, [boxId, fetchPointRanges]);

  const getDefaultRange = (prizeName: string) => {
    switch (prizeName) {
      case "기본 포인트 A":
        return boxType === "BRONZE" ? "1-2" : "10-20";
      case "기본 포인트 B":
        return boxType === "BRONZE" ? "3-5" : "30-40";
      case "기본 포인트 C":
        return boxType === "BRONZE" ? "6-8" : "50-60";
      default:
        return "미설정";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                기본 포인트 범위 관리
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {boxType} 박스의 기본 포인트 A, B, C의 지급 범위를 설정합니다
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchPointRanges}
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              새로고침
            </button>
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? "저장 중..." : "저장"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                편집
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {pointRanges.length > 0 ? (
          <div className="grid gap-6">
            {["기본 포인트 A", "기본 포인트 B", "기본 포인트 C"].map((pointType) => {
              const range = pointRanges.find(r => r.prizeName === pointType);
              const isA = pointType === "기본 포인트 A";
              const isB = pointType === "기본 포인트 B";
              
              return (
                <div key={pointType} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🪙</span>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{pointType}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {range ? `Prize ID: ${range.prizeId}` : "상품 미등록"}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      range?.isConfigured 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {range?.isConfigured ? '✅ 설정됨' : '⚠️ 미설정'}
                    </div>
                  </div>

                  {editMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          최소값
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={isA ? pointAMinInput : isB ? pointBMinInput : pointCMinInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (isA) setPointAMinInput(value);
                            else if (isB) setPointBMinInput(value);
                            else setPointCMinInput(value);
                          }}
                          onFocus={(e) => {
                            // focus 시 값이 기본값(0 또는 1)이면 빈 문자열로 변경하여 입력 편의성 향상
                            if (e.target.value === '0' || e.target.value === '1') {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            const numValue = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                            if (isA) {
                              setPointAMin(numValue);
                              setPointAMinInput(numValue.toString());
                            } else if (isB) {
                              setPointBMin(numValue);
                              setPointBMinInput(numValue.toString());
                            } else {
                              setPointCMin(numValue);
                              setPointCMinInput(numValue.toString());
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          최대값
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={isA ? pointAMaxInput : isB ? pointBMaxInput : pointCMaxInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (isA) setPointAMaxInput(value);
                            else if (isB) setPointBMaxInput(value);
                            else setPointCMaxInput(value);
                          }}
                          onFocus={(e) => {
                            // focus 시 값이 기본값(0 또는 1)이면 빈 문자열로 변경하여 입력 편의성 향상
                            if (e.target.value === '0' || e.target.value === '1') {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            const numValue = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                            if (isA) {
                              setPointAMax(numValue);
                              setPointAMaxInput(numValue.toString());
                            } else if (isB) {
                              setPointBMax(numValue);
                              setPointBMaxInput(numValue.toString());
                            } else {
                              setPointCMax(numValue);
                              setPointCMaxInput(numValue.toString());
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">현재 설정</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {range?.isConfigured 
                              ? `${range.minValue}~${range.maxValue} 포인트`
                              : "미설정"
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">시스템 권장 범위 (참고용)</div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {getDefaultRange(pointType)} 포인트
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">상태</div>
                          <div className={`font-semibold ${
                            range?.isConfigured 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {range?.isConfigured ? '정상 운영' : '하드코딩 중'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🪙</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              기본 포인트 상품이 없습니다
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              먼저 &quot;기본 포인트 A&quot;, &quot;기본 포인트 B&quot;, &quot;기본 포인트 C&quot; 상품을 등록해주세요
            </p>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
            <div className="text-blue-800 dark:text-blue-200 text-sm">
              <p className="font-medium mb-2">기본 포인트 범위 설정 안내:</p>
              <ul className="space-y-1 text-xs">
                <li>• 기본 포인트 A, B, C는 재고가 부족하거나 특별상품 당첨 실패 시 대체 지급됩니다</li>
                <li>• 설정된 범위 내에서 랜덤하게 포인트가 지급됩니다</li>
                <li>• 미설정 시 하드코딩된 기본값이 사용됩니다 (코드 수정 필요)</li>
                <li>• 박스 타입별로 권장 범위가 다릅니다 (브론즈: 낮은 범위, 실버: 높은 범위)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
