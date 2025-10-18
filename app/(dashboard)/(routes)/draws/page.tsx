"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Play } from "lucide-react";
import Link from "next/link";

// 뽑기별 이모지 매핑
const getDrawTypeEmoji = (drawName: string): string => {
  if (drawName.includes('커피') || drawName.includes('음료')) return '☕';
  if (drawName.includes('간식') || drawName.includes('스낵')) return '🍿';
  if (drawName.includes('상품') || drawName.includes('기프티콘')) return '🎁';
  if (drawName.includes('프리미엄') || drawName.includes('특별')) return '💎';
  if (drawName.includes('일반') || drawName.includes('베이직')) return '🎪';
  if (drawName.includes('이벤트')) return '🎉';
  if (drawName.includes('포인트')) return '🪙';
  if (drawName.includes('치킨') || drawName.includes('닭')) return '🍗';
  if (drawName.includes('햄버거') || drawName.includes('버거')) return '🍔';
  if (drawName.includes('도넛')) return '🍩';
  if (drawName.includes('아이스크림') || drawName.includes('ice')) return '🍦';
  return '🎲'; // 기본값을 주사위로 변경 (뽑기에 더 적합)
};

interface DrawPrizeSimpleDTO {
  id: number;
  prizeId: number;
  prizeName: string;
  prizeBrand: string;
  prizeType: string;
  winningProbability: number;
  remainingCount: number;
  totalWinningCount: number;
  winningPeriodDays: number;
}

interface DrawAdminDTO {
  id: number;
  drawName: string;
  drawType: string;
  participationCost: number;
  maxParticipationsPerDay: number;
  reentryRestrictionDays: number;
  isActive: boolean;
  prizes: DrawPrizeSimpleDTO[];
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  regTsp: string;
  modTsp: string;
}

interface DrawsResponse {
  content: DrawAdminDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  const fetchDraws = useCallback(async (page: number = 0, search: string = "") => {
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
      const fullUrl = `${apiUrl}/admin/draws?${queryParams}`;
      
      console.log("Fetching draws from:", fullUrl);
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

      const data: DrawsResponse = await response.json();
      console.log("Received data:", data);
      
      setDraws(data.content);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching draws:", error);
      alert(`뽑기 목록을 불러오는데 실패했습니다: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchDraws(0, searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const deleteDraw = async (id: number) => {
    if (!confirm("정말로 이 뽑기를 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("뽑기 삭제에 실패했습니다.");
      }

      fetchDraws(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting draw:", error);
      alert("뽑기 삭제에 실패했습니다.");
    }
  };

  const toggleDrawStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${id}/toggle-status`,
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
        throw new Error("뽑기 상태 변경에 실패했습니다.");
      }

      fetchDraws(currentPage, searchTerm);
    } catch (error) {
      console.error("Error toggling draw status:", error);
      alert("뽑기 상태 변경에 실패했습니다.");
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

  const renderPaginationButton = (page: number, label: string = page.toString()) => (
    <button
      key={page}
      onClick={() => fetchDraws(page, searchTerm)}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          뽑기 관리
        </h1>
        <Link
          href="/draws/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          새 뽑기 생성
        </Link>
      </div>

      {/* 검색 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="뽑기 이름으로 검색..."
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

      {/* 뽑기 목록 - 카드 형태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {draws.map((draw) => (
          <div
            key={draw.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            {/* 카드 헤더 */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDrawTypeEmoji(draw.drawName)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {draw.drawName}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {draw.participationCost}P 참여
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  draw.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {draw.isActive ? '활성' : '비활성'}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>🔄 재당첨제한 {draw.reentryRestrictionDays}일</span>
                <span>📊 일일 {draw.maxParticipationsPerDay}회</span>
              </div>
            </div>

            {/* 상품 목록 표시 (최대 4개) */}
            <div className="p-5">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                상품 목록
              </h4>
              <div className="space-y-2">
                {draw.prizes.slice(0, 4).map((prize) => (
                  <div key={prize.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span>{getPrizeTypeIcon(prize.prizeType)}</span>
                      <span className="text-gray-800 dark:text-gray-200 truncate font-medium">
                        {prize.prizeName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                        {prize.winningProbability.toFixed(1)}%
                      </span>
                      <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        {prize.remainingCount}개
                      </span>
                    </div>
                  </div>
                ))}
                {draw.prizes.length > 4 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                    +{draw.prizes.length - 4}개 더...
                  </div>
                )}
                {draw.prizes.length === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    등록된 상품이 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 카드 액션 버튼 */}
            <div className="px-5 pb-5">
              <div className="flex items-center space-x-2">
                <Link
                  href={`/draws/${draw.id}`}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit size={16} className="mr-1" />
                  상세 관리
                </Link>
                <button
                  onClick={() => toggleDrawStatus(draw.id, draw.isActive)}
                  className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors text-sm ${
                    draw.isActive
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  <Play size={16} className="mr-1" />
                  {draw.isActive ? '비활성' : '활성'}
                </button>
                <button
                  onClick={() => deleteDraw(draw.id)}
                  className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-200 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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

      {draws.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl mb-2">🎯</div>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "검색 결과가 없습니다." : "등록된 뽑기가 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}
