"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Play } from "lucide-react";
import Link from "next/link";

// 박스 타입별 이모지 매핑
const getBoxTypeEmoji = (boxType: string): string => {
  switch (boxType) {
    case 'BRONZE': return '🥉';
    case 'SILVER': return '🥈';
    case 'GOLD': return '🥇';
    case 'PREMIUM': return '💎';
    case 'WELCOME': return '🎁';
    default: return '📦';
  }
};

const getBoxTypeLabel = (boxType: string): string => {
  switch (boxType) {
    case 'BRONZE': return '브론즈';
    case 'SILVER': return '실버';
    case 'GOLD': return '골드';
    case 'PREMIUM': return '프리미엄';
    case 'WELCOME': return '웰컴';
    default: return boxType;
  }
};

interface RandomBoxPrizeSimpleDTO {
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
  winningStartDate: string; // 재고 시작일
  nextRestockDate?: string; // 다음 재고 초기화 날짜 (선택적)
  socialProofEnabled: boolean;
  pushEnabled: boolean;
}

interface RandomBoxAdminDTO {
  id: number;
  name: string;
  description: string;
  boxType: string;
  ticketCost: number;
  isActive: boolean;
  imageUrl: string;
  prizes: RandomBoxPrizeSimpleDTO[];
  regTsp: string;
  modTsp: string;
}

interface BoxesResponse {
  content: RandomBoxAdminDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<RandomBoxAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list'); // 뷰 모드 상태 추가
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]); // 비교용 박스 선택

  const fetchBoxes = useCallback(async (page: number = 0, search: string = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No access token found");
        alert("로그인이 필요합니다. 다시 로그인해주세요.");
        window.location.href = "/login";
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        ...(search && { search }),
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const fullUrl = `${apiUrl}/admin/random-boxes?${queryParams}`;
      
      console.log("Fetching boxes from:", fullUrl);
      console.log("Token:", token ? "Present" : "Missing");

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Token expired or invalid");
          localStorage.removeItem("token");
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
          return;
        }
        
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data: BoxesResponse = await response.json();
      console.log("Received data:", data);
      
      setBoxes(data.content);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching boxes:", error);
      alert(`박스 목록을 불러오는데 실패했습니다: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchBoxes(0, searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const deleteBox = async (id: number) => {
    if (!confirm("정말로 이 박스를 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/random-boxes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("박스 삭제에 실패했습니다.");
      }

      fetchBoxes(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting box:", error);
      alert("박스 삭제에 실패했습니다.");
    }
  };

  const toggleBoxStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/random-boxes/${id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("박스 상태 변경에 실패했습니다.");
      }

      fetchBoxes(currentPage, searchTerm);
    } catch (error) {
      console.error("Error toggling box status:", error);
      alert("박스 상태 변경에 실패했습니다.");
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

  // 박스 선택/해제 함수
  const toggleBoxSelection = (boxId: number) => {
    setSelectedBoxes(prev => {
      if (prev.includes(boxId)) {
        return prev.filter(id => id !== boxId);
      } else if (prev.length < 2) {
        return [...prev, boxId];
      } else {
        // 2개 이상 선택 시 첫 번째를 제거하고 새로운 것 추가
        return [prev[1], boxId];
      }
    });
  };

  // 선택된 박스들 가져오기
  const getSelectedBoxes = () => {
    return boxes.filter(box => selectedBoxes.includes(box.id));
  };

  // 뷰 모드 전환
  const switchViewMode = (mode: 'list' | 'compare') => {
    setViewMode(mode);
    if (mode === 'list') {
      setSelectedBoxes([]);
    }
  };

  const renderPaginationButton = (page: number, label: string = page.toString()) => (
    <button
      key={page}
      onClick={() => fetchBoxes(page, searchTerm)}
      className={`px-3 py-2 text-sm font-medium rounded-md ${
        currentPage === page
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );

  const totalPages = Math.ceil(totalElements / pageSize);
  const startPage = Math.max(0, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          박스 관리
        </h1>
        <div className="flex items-center space-x-3">
          {/* 뷰 모드 전환 버튼 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => switchViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 리스트
            </button>
            <button
              onClick={() => switchViewMode('compare')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'compare'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ⚡ 비교
            </button>
          </div>
          <Link
            href="/boxes/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            새 박스 생성
          </Link>
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="박스 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          검색
        </button>
      </div>

      {/* 비교 모드 안내 */}
      {viewMode === 'compare' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 dark:text-blue-400">⚡</span>
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              비교할 박스를 최대 2개까지 선택하세요 ({selectedBoxes.length}/2)
            </p>
          </div>
          {selectedBoxes.length === 2 && (
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
              ✨ 2개 박스가 선택되어 아래에서 상세 비교를 확인할 수 있습니다
            </p>
          )}
        </div>
      )}

      {/* 박스 목록 - 조건부 렌더링 */}
      {viewMode === 'list' ? (
        // 기존 리스트 뷰
        <div className="space-y-4">
          {boxes.map((box) => (
            <div
              key={box.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
            {/* 박스 헤더 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{getBoxTypeEmoji(box.boxType)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {box.name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {box.ticketCost}티켓 소모 · {getBoxTypeLabel(box.boxType)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    box.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {box.isActive ? '활성' : '비활성'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/boxes/${box.id}`}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit size={16} className="mr-1" />
                      상세 관리
                    </Link>
                    <button
                      onClick={() => toggleBoxStatus(box.id, box.isActive)}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors text-sm ${
                        box.isActive
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      <Play size={16} className="mr-1" />
                      {box.isActive ? '비활성' : '활성'}
                    </button>
                    <button
                      onClick={() => deleteBox(box.id)}
                      className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-200 transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {box.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {box.description}
                </p>
              )}
            </div>

            {/* 상품 목록 - 모든 상품 표시 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  📦 상품 목록 ({box.prizes.length}개)
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  총 확률: {box.prizes.reduce((sum, prize) => sum + prize.winningProbability, 0).toFixed(1)}%
                </div>
              </div>
              
              {box.prizes.length > 0 ? (
                <div className="space-y-2">
                  {/* 당첨률 높은 순으로 정렬 */}
                  {[...box.prizes]
                    .sort((a, b) => b.winningProbability - a.winningProbability)
                    .map((prize) => (
                    <div key={prize.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm">
                      {/* 상품 헤더 - 상품명과 당첨률 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-lg">{getPrizeTypeIcon(prize.prizeType)}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                              {prize.prizeName}
                            </h5>
                            {prize.prizeBrand && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {prize.prizeBrand}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {prize.winningProbability.toFixed(1)}%
                        </div>
                      </div>
                      
                      {/* 운영 핵심 정보 테이블 */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
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
                        
                        {/* 다음 재고 초기화 날짜 */}
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
                            <div className="text-gray-500 dark:text-gray-400">
                              ⏰ 제한: {prize.winningPeriodDays}일 | 🏆 총 당첨: {(prize.totalWinningCount - prize.remainingCount).toLocaleString()}회
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-gray-400 text-4xl mb-2">📦</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    등록된 상품이 없습니다
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    상세 관리에서 상품을 추가해보세요
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      ) : (
        // 비교 모드 - 박스 선택 그리드
        <div className="space-y-6">
          {/* 박스 선택 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boxes.map((box) => (
              <div
                key={box.id}
                onClick={() => toggleBoxSelection(box.id)}
                className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                  selectedBoxes.includes(box.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* 선택 체크마크 */}
                {selectedBoxes.includes(box.id) && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg z-10">
                    ✓
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{getBoxTypeEmoji(box.boxType)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {box.name}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {box.ticketCost}티켓 · {getBoxTypeLabel(box.boxType)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      box.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {box.isActive ? '✅ 활성' : '❌ 비활성'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      상품 {box.prizes.length}개 · 총 {box.prizes.reduce((sum, prize) => sum + prize.winningProbability, 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 선택된 박스 비교 뷰 */}
          {selectedBoxes.length === 2 && (
            <div className="mt-8">
              <div className="flex items-center justify-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ⚡ 박스 비교 분석
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getSelectedBoxes().map((box) => (
                  <div key={box.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* 박스 헤더 */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
                      <div className="flex items-center space-x-4">
                        <span className="text-4xl">{getBoxTypeEmoji(box.boxType)}</span>
                        <div>
                          <h3 className="text-2xl font-bold">{box.name}</h3>
                          <p className="text-blue-100">
                            {box.ticketCost}티켓 소모 · {getBoxTypeLabel(box.boxType)}
                          </p>
                          <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                            box.isActive 
                              ? 'bg-green-500/20 text-green-100' 
                              : 'bg-red-500/20 text-red-100'
                          }`}>
                            {box.isActive ? '✅ 활성' : '❌ 비활성'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 상품 목록 - MAP_RANDOMBOX_PRIZE 상세 정보 */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          🎁 상품 상세 ({box.prizes.length}개)
                        </h4>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          총 확률: {box.prizes.reduce((sum, prize) => sum + prize.winningProbability, 0).toFixed(1)}%
                        </div>
                      </div>
                      
                      {box.prizes.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {/* 당첨률 높은 순으로 정렬 */}
                          {[...box.prizes]
                            .sort((a, b) => b.winningProbability - a.winningProbability)
                            .map((prize) => (
                            <div key={prize.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm">
                              {/* 상품 헤더 - 상품명과 당첨률 */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <span className="text-lg">{getPrizeTypeIcon(prize.prizeType)}</span>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                                      {prize.prizeName}
                                    </h5>
                                    {prize.prizeBrand && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {prize.prizeBrand}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  {prize.winningProbability.toFixed(1)}%
                                </div>
                              </div>
                              
                              {/* 운영 핵심 정보 테이블 */}
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
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
                                
                                {/* 다음 재고 초기화 날짜 */}
                                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <div className="text-gray-500 dark:text-gray-400 mb-1 text-xs">🔄 다음 재고 초기화</div>
                                  <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                                    {prize.nextRestockDate ? 
                                      new Date(prize.nextRestockDate).toLocaleDateString('ko-KR', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                      }) + ' (' + Math.ceil((new Date(prize.nextRestockDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + '일 후)'
                                      : '미정'}
                                  </div>
                                </div>
                                
                                {/* 제한 기간 */}
                                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>⏰ 제한: {prize.winningPeriodDays}일</span>
                                  <span>🏆 총 당첨: {(prize.totalWinningCount - prize.remainingCount).toLocaleString()}회</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-gray-400 text-3xl mb-2">📦</div>
                          <p className="text-gray-500 dark:text-gray-400">상품이 없습니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          {currentPage > 0 && renderPaginationButton(currentPage - 1, "이전")}
          
          {startPage > 0 && (
            <>
              {renderPaginationButton(0, "1")}
              {startPage > 1 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}
          
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page =>
            renderPaginationButton(page)
          )}
          
          {endPage < totalPages - 1 && (
            <>
              {endPage < totalPages - 2 && <span className="px-2 text-gray-500">...</span>}
              {renderPaginationButton(totalPages - 1, totalPages.toString())}
            </>
          )}
          
          {currentPage < totalPages - 1 && renderPaginationButton(currentPage + 1, "다음")}
        </div>
      )}

      {boxes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl mb-2">📦</div>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "검색 결과가 없습니다." : "등록된 박스가 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}
