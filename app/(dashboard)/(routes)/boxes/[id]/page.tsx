"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  Play,
  Square,
  RefreshCw,
  Settings
} from "lucide-react";
import Link from "next/link";
import PointRangeManager from "../../../../../components/PointRangeManager";
import BoxProbabilityManager from "../../../../../components/boxes/BoxProbabilityManager";

// 박스 타입별 이모지 매핑
const getBoxTypeEmoji = (boxType: string): string => {
  switch (boxType) {
    case 'BRONZE': return '🥉';
    case 'SILVER': return '🥈';
    case 'GOLD': return '🥇';
    case 'PREMIUM': return '💎';
    default: return '📦';
  }
};

const getBoxTypeLabel = (boxType: string): string => {
  switch (boxType) {
    case 'BRONZE': return '브론즈';
    case 'SILVER': return '실버';
    case 'GOLD': return '골드';
    case 'PREMIUM': return '프리미엄';
    default: return boxType;
  }
};

const getPrizeTypeIcon = (prizeType: string): string => {
  switch (prizeType) {
    case 'POINT': return '🪙';
    case 'GIFTICON': return '🎫';
    case 'PHYSICAL': return '📦';
    default: return '🎁';
  }
};

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

interface PointRange {
  prizeId: number;
  prizeName: string;
  minValue: number | null;
  maxValue: number | null;
  isConfigured: boolean;
}

interface RandomBox {
  id: number;
  name: string;
  description: string;
  boxType: string;
  ticketCost: number;
  isActive: boolean;
  imageUrl: string;
  prizes: RandomBoxPrize[];
  regTsp: string;
  modTsp: string;
}

export default function BoxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boxId = params.id as string;
  
  const [box, setBox] = useState<RandomBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'points'>('info');
  
  // 편집 상태
  const [editBox, setEditBox] = useState<RandomBox | null>(null);
  const [totalProbability, setTotalProbability] = useState(0);

  // 확률 일괄 관리 상태
  const [showProbabilityManager, setShowProbabilityManager] = useState(false);
  const [pointRanges, setPointRanges] = useState<PointRange[]>([]);

  // 상품별 수정 상태
  const [editingPrize, setEditingPrize] = useState<RandomBoxPrize | null>(null);
  const [editPrizeModal, setEditPrizeModal] = useState(false);
  const [totalWinningCountInput, setTotalWinningCountInput] = useState<string>('');
  const [remainingCountInput, setRemainingCountInput] = useState<string>('');

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [ticketCostInput, setTicketCostInput] = useState<string>('');

  const fetchBoxDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert("박스를 찾을 수 없습니다.");
          router.push("/boxes");
          return;
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("박스 상세 정보:", data);
      
      setBox(data);
      setEditBox(data);
      
      // 로컬 상태 초기화
      setTicketCostInput(data.ticketCost.toString());
      
      // 총 확률 계산
      const total = data.prizes.reduce((sum: number, prize: RandomBoxPrize) => 
        sum + prize.winningProbability, 0);
      setTotalProbability(total);
      
    } catch (error) {
      console.error("박스 상세 정보 로딩 실패:", error);
      alert("박스 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [boxId, router]);

  const fetchPointRanges = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/point-ranges`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: PointRange[] = await response.json();
        setPointRanges(data);
      }
    } catch (error) {
      console.error("포인트 범위 정보 로딩 실패:", error);
      // 포인트 범위 정보는 선택사항이므로 에러 무시
    }
  }, [boxId]);

  useEffect(() => {
    if (boxId) {
      fetchBoxDetail();
      fetchPointRanges();
    }
  }, [boxId, fetchBoxDetail, fetchPointRanges]);

  const handleSave = async () => {
    if (!editBox) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editBox.name,
          description: editBox.description,
          boxType: editBox.boxType,
          ticketCost: editBox.ticketCost,
          isActive: editBox.isActive,
          imageUrl: editBox.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("박스 정보 저장에 실패했습니다.");
      }

      setBox(editBox);
      setEditMode(false);
      alert("박스 정보가 저장되었습니다.");
      
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBoxStatus = async () => {
    if (!box) return;
    
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !box.isActive }),
      });

      if (!response.ok) {
        throw new Error("상태 변경에 실패했습니다.");
      }

      setBox({ ...box, isActive: !box.isActive });
      setEditBox({ ...box, isActive: !box.isActive });
      
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  // 상품 수정 시작
  const startEditPrize = (prize: RandomBoxPrize) => {
    setEditingPrize(prize);
    setTotalWinningCountInput(prize.totalWinningCount.toString());
    setRemainingCountInput(prize.remainingCount.toString());
    setEditPrizeModal(true);
  };

  // 상품 수정 저장
  const savePrizeEdit = async () => {
    if (!editingPrize) return;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const totalWinningCount = parseInt(totalWinningCountInput) || 0;
      const remainingCount = parseInt(remainingCountInput) || 0;

      if (totalWinningCount < 0 || remainingCount < 0) {
        alert("재고는 0 이상이어야 합니다.");
        return;
      }

      if (remainingCount > totalWinningCount) {
        alert("남은 재고는 총 재고보다 클 수 없습니다.");
        return;
      }

      const response = await fetch(`${apiUrl}/admin/random-boxes/${boxId}/prizes/${editingPrize.id}/stock`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalWinningCount,
          remainingCount
        }),
      });

      if (!response.ok) {
        throw new Error("재고 수정에 실패했습니다.");
      }

      // 성공 시 박스 정보 새로고침
      await fetchBoxDetail();
      setEditPrizeModal(false);
      setEditingPrize(null);
      
    } catch (error) {
      console.error("재고 수정 실패:", error);
      alert("재고 수정에 실패했습니다.");
    }
  };

  // 상품 수정 취소
  const cancelPrizeEdit = () => {
    setEditPrizeModal(false);
    setEditingPrize(null);
    setTotalWinningCountInput('');
    setRemainingCountInput('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-xl mb-2">📦</div>
        <p className="text-gray-500 dark:text-gray-400">박스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isProbabilityValid = Math.abs(totalProbability - 100) < 0.1;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/boxes"
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            박스 목록으로 돌아가기
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchBoxDetail()}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            새로고침
          </button>
          
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setEditBox(box);
                  setEditMode(false);
                }}
                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
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
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} className="mr-2" />
              편집
            </button>
          )}
        </div>
      </div>

      {/* 박스 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{getBoxTypeEmoji(box.boxType)}</span>
              <div>
                {editMode ? (
                  <input
                    type="text"
                    value={editBox?.name || ""}
                    onChange={(e) => setEditBox(editBox ? { ...editBox, name: e.target.value } : null)}
                    className="text-2xl font-bold bg-white/20 rounded px-2 py-1 text-white placeholder-white/70"
                    placeholder="박스 이름"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{box.name}</h1>
                )}
                <p className="text-blue-100 mt-1">
                  {editMode ? (
                    <input
                      type="number"
                      value={ticketCostInput}
                      onChange={(e) => {
                        setTicketCostInput(e.target.value);
                      }}
                      onFocus={(e) => {
                        // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        const numValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        setEditBox(editBox ? { ...editBox, ticketCost: numValue } : null);
                        setTicketCostInput(numValue.toString());
                      }}
                      className="bg-white/20 rounded px-2 py-1 text-blue-100 placeholder-blue-200 w-20"
                      min={1}
                    />
                  ) : (
                    box.ticketCost
                  )}
                  티켓 소모 · {getBoxTypeLabel(box.boxType)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleBoxStatus}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  box.isActive 
                    ? 'bg-red-500/20 text-red-100 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-100 hover:bg-green-500/30'
                }`}
              >
                {box.isActive ? (
                  <>
                    <Square size={16} className="mr-2" />
                    비활성화
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" />
                    활성화
                  </>
                )}
              </button>
              <div className={`px-4 py-2 rounded-lg font-medium ${
                box.isActive 
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-red-500/20 text-red-100'
              }`}>
                {box.isActive ? '✅ 활성' : '❌ 비활성'}
              </div>
            </div>
          </div>
          
          {box.description && (
            <div className="mt-4">
              {editMode ? (
                <textarea
                  value={editBox?.description || ""}
                  onChange={(e) => setEditBox(editBox ? { ...editBox, description: e.target.value } : null)}
                  className="w-full bg-white/20 rounded px-3 py-2 text-white placeholder-white/70 resize-none"
                  placeholder="박스 설명"
                  rows={2}
                />
              ) : (
                <p className="text-blue-100">{box.description}</p>
              )}
            </div>
          )}
        </div>
        
        {/* 확률 요약 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                📊 확률 요약
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                상품 {box.prizes.length}개 · 등록일: {new Date(box.regTsp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                isProbabilityValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {totalProbability.toFixed(1)}%
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {isProbabilityValid ? (
                  <span className="text-green-600 dark:text-green-400">✅ 확률 유효</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">⚠️ 확률 조정 필요</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              📊 기본 정보 & 상품 관리
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'points'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              🪙 기본 포인트 관리
            </button>
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'info' ? (
        <div className="space-y-6">
          {/* 상품 관리 섹션 (통합) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎁 상품 관리
                </h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowProbabilityManager(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Settings size={16} className="mr-2" />
                    확률 일괄 관리
                  </button>
                  <button 
                    onClick={() => alert('상품 추가 기능은 추후 구현 예정입니다.')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    상품 추가
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {box.prizes.length > 0 ? (
                <div className="space-y-3">
                  {/* 확률 높은순으로 정렬 */}
                  {[...box.prizes]
                    .sort((a, b) => b.winningProbability - a.winningProbability)
                    .map((prize, index) => (
                      <div key={prize.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                        {/* 상품 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span className="text-xl">{getPrizeTypeIcon(prize.prizeType)}</span>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {prize.prizeName}
                              </h3>
                              {prize.prizeBrand && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {prize.prizeBrand}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* 확률 표시 */}
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">당첨률:</label>
                              <span className={`font-medium px-2 py-1 rounded text-sm ${
                                prize.winningProbability >= 10 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                prize.winningProbability >= 5 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                prize.winningProbability >= 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {prize.winningProbability.toFixed(1)}%
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => startEditPrize(prize)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {/* 운영 정보 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {/* 재고 시작일 */}
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">📅 재고 시작일</div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {prize.winningStartDate ? 
                                  new Date(prize.winningStartDate).toLocaleDateString('ko-KR', {
                                    month: 'short', day: 'numeric'
                                  }) + ' (' + Math.floor((Date.now() - new Date(prize.winningStartDate).getTime()) / (1000 * 60 * 60 * 24)) + '일째)' 
                                  : '미설정'}
                              </div>
                            </div>
                            
                            {/* 총 재고 */}
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">📦 총 재고</div>
                              <div className="font-semibold text-blue-600 dark:text-blue-400">
                                {prize.totalWinningCount.toLocaleString()}개
                              </div>
                            </div>
                            
                            {/* 남은 재고 */}  
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">📋 남은 재고</div>
                              <div className={`font-semibold ${
                                prize.remainingCount === 0 ? 'text-red-600 dark:text-red-400' :
                                prize.remainingCount < 10 ? 'text-orange-600 dark:text-orange-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>
                                {prize.remainingCount.toLocaleString()}개
                                {prize.remainingCount === 0 && ' (⚠️ 품절)'}
                              </div>
                            </div>
                            
                            {/* 재고 소진률 */}
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">📊 소진률</div>
                              <div className="font-semibold text-purple-600 dark:text-purple-400">
                                {((prize.totalWinningCount - prize.remainingCount) / prize.totalWinningCount * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* 추가 정보 */}
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">🔄 다음 재고 초기화: </span>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {prize.nextRestockDate ? 
                                    new Date(prize.nextRestockDate).toLocaleDateString('ko-KR', {
                                      year: 'numeric', month: 'short', day: 'numeric'
                                    }) + ' (' + Math.ceil((new Date(prize.nextRestockDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + '일 후)'
                                    : '미정'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                                <span>⏰ 제한: {prize.winningPeriodDays}일</span>
                                <span>🏆 총 당첨: {(prize.totalWinningCount - prize.remainingCount).toLocaleString()}회</span>
                              </div>
                            </div>
                            
                            {/* 설정 토글 */}
                            <div className="flex items-center space-x-4 mt-2">
                              <label className="flex items-center space-x-2 text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={prize.socialProofEnabled}
                                  onChange={() => {}} // TODO: 소셜 프루프 토글 기능 구현 필요
                                  className="rounded" 
                                />
                                <span>📢 소셜 프루프</span>
                              </label>
                              <label className="flex items-center space-x-2 text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={prize.pushEnabled}
                                  onChange={() => {}} // TODO: 푸시 알림 토글 기능 구현 필요
                                  className="rounded" 
                                />
                                <span>🔔 푸시 알림</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🎁</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    등록된 상품이 없습니다
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    상품을 추가해서 박스를 구성해보세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 기본 포인트 관리 컴포넌트 */}
          <PointRangeManager boxId={boxId} boxType={box.boxType} />
        </div>
      )}

      {/* 확률 일괄 관리 모달 */}
      {showProbabilityManager && box && (
        <BoxProbabilityManager
          boxId={boxId}
          prizes={box.prizes}
          pointRanges={pointRanges}
          onClose={() => setShowProbabilityManager(false)}
          onSuccess={() => {
            fetchBoxDetail();
            fetchPointRanges();
          }}
        />
      )}

      {/* 상품 수정 모달 */}
      {editPrizeModal && editingPrize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                상품 재고 수정
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {editingPrize.prizeName}
              </p>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-4">
              {/* 총 재고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  총 재고
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalWinningCountInput}
                  onChange={(e) => setTotalWinningCountInput(e.target.value)}
                  onBlur={() => {
                    const value = parseInt(totalWinningCountInput) || 0;
                    setTotalWinningCountInput(value.toString());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="총 재고 수량"
                />
              </div>

              {/* 남은 재고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  남은 재고
                </label>
                <input
                  type="number"
                  min="0"
                  value={remainingCountInput}
                  onChange={(e) => setRemainingCountInput(e.target.value)}
                  onBlur={() => {
                    const value = parseInt(remainingCountInput) || 0;
                    setRemainingCountInput(value.toString());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="남은 재고 수량"
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 남은 재고는 총 재고보다 클 수 없습니다.
                </p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={cancelPrizeEdit}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={savePrizeEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
