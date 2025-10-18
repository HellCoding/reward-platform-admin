"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Gift, Package, Ticket, Coins } from "lucide-react";
import Link from "next/link";
import { prizeService } from "@/services/randomBoxService";

// 기본 상품 이미지 (웹 프로젝트에서 복사해온 실제 파일)
const DEFAULT_PRIZE_IMAGE = "/images/default-prize.png";

// 상품 타입별 아이콘 매핑
const getPrizeTypeIcon = (prizeType: string): React.JSX.Element => {
  switch (prizeType?.toUpperCase()) {
    case 'POINT': return <Coins className="w-5 h-5 text-yellow-500" />;
    case 'GIFTICON': return <Ticket className="w-5 h-5 text-green-500" />;
    case 'PHYSICAL': return <Package className="w-5 h-5 text-blue-500" />;
    default: return <Gift className="w-5 h-5 text-purple-500" />;
  }
};

const getPrizeTypeLabel = (prizeType: string): string => {
  switch (prizeType?.toUpperCase()) {
    case 'POINT': return '포인트';
    case 'GIFTICON': return '기프티콘';
    case 'PHYSICAL': return '실물';
    default: return prizeType || '기타';
  }
};

interface Prize {
  id: number;
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  imageUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrizesResponse {
  content: Prize[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 백엔드 응답을 프론트엔드 형식으로 변환
const mapBackendResponseToFrontend = (backendPrize: {
  prizeId: number;
  name: string;
  brand: string;
  prizeType: string;
  value: number;
  thumbnailUrl?: string;
  description?: string;
  isActive?: boolean;
  displayStatus?: boolean;
  displayStartDate?: string;
  displayEndDate?: string;
}): Prize => ({
  id: backendPrize.prizeId,
  name: backendPrize.name,
  brand: backendPrize.brand,
  prizeType: backendPrize.prizeType,  // 🔄 type → prizeType 변경
  value: backendPrize.value,
  imageUrl: backendPrize.thumbnailUrl || DEFAULT_PRIZE_IMAGE,
  description: backendPrize.description,
  isActive: backendPrize.isActive !== undefined ? backendPrize.isActive : backendPrize.displayStatus !== undefined ? backendPrize.displayStatus : true,
  createdAt: backendPrize.displayStartDate || new Date().toISOString(),
  updatedAt: backendPrize.displayEndDate || new Date().toISOString()
});

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const fetchPrizes = useCallback(async (page: number = 0, search: string = "", type: string = "", active: string = "") => {
    try {
      setLoading(true);
      
      const params: { [key: string]: string } = {
        page: page.toString(),
        size: pageSize.toString(),
      };
      
      if (search) params.search = search;
      if (type) params.type = type;
      if (active !== "") params.isActive = (active === "true").toString();

      console.log("상품 목록 조회 파라미터:", params);
      
      // 실제 API 호출 시도
      try {
        const data = await prizeService.getPrizes(params) as PrizesResponse;
        
        // 백엔드 응답을 프론트엔드 형식으로 변환
        const mappedPrizes = (data.content as unknown[]).map((item) => 
          mapBackendResponseToFrontend(item as {
            prizeId: number;
            name: string;
            brand: string;
            prizeType: string;
            value: number;
            thumbnailUrl?: string;
            description?: string;
            isActive?: boolean;
            displayStatus?: boolean;
            displayStartDate?: string;
            displayEndDate?: string;
          })
        );
        
        setPrizes(mappedPrizes);
        setTotalElements(data.totalElements);
        setCurrentPage(page);
      } catch (apiError) {
        console.error("API 호출 실패, 목 데이터 사용:", apiError);
        
        // API 실패 시 목 데이터 생성
        const mockPrizes: Prize[] = [
          {
            id: 1,
            name: "기본 포인트 A",
            brand: "SHUFFLEX",
            prizeType: "POINT",  // 🔄 type → prizeType 변경
            value: 0, // 가변 포인트
            imageUrl: "/images/img-point.png",
            description: "브론즈: 1~2포인트, 실버: 10~20포인트 (DB 설정 범위)",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 2,
            name: "기본 포인트 B",
            brand: "SHUFFLEX",
            prizeType: "POINT",  // 🔄 type → prizeType 변경
            value: 0, // 가변 포인트
            imageUrl: "/images/img-point.png",
            description: "브론즈: 3~5포인트, 실버: 30~40포인트 (DB 설정 범위)",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 3,
            name: "기본 포인트 C",
            brand: "SHUFFLEX",
            prizeType: "POINT",  // 🔄 type → prizeType 변경
            value: 0, // 가변 포인트
            imageUrl: "/images/img-point.png",
            description: "브론즈: 6~8포인트, 실버: 50~60포인트 (DB 설정 범위)",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 4,
            name: "300 포인트",
            brand: "SHUFFLEX",
            prizeType: "POINT",  // 🔄 type → prizeType 변경
            value: 300,
            imageUrl: "/images/img-point.png", 
            description: "고정 300포인트 상품",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 5,
            name: "스타벅스 아메리카노",
            brand: "STARBUCKS",
            prizeType: "GIFTICON",  // 🔄 type → prizeType 변경
            value: 4500,
            imageUrl: "/images/icon-coffee.svg",
            description: "스타벅스 아메리카노 기프티콘",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 6,
            name: "배스킨라빈스 파인트",
            brand: "BASKINROBBINS",
            prizeType: "GIFTICON",  // 🔄 type → prizeType 변경
            value: 8000,
            imageUrl: "/images/icon-giftcard.svg",
            description: "배스킨라빈스 파인트 아이스크림",
            isActive: false,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          },
          {
            id: 7,
            name: "에어팟 프로",
            brand: "APPLE",
            prizeType: "PHYSICAL",  // 🔄 type → prizeType 변경
            value: 250000,
            imageUrl: DEFAULT_PRIZE_IMAGE,
            description: "애플 에어팟 프로 3세대",
            isActive: true,
            createdAt: "2024-01-01T00:00:00",
            updatedAt: "2024-01-01T00:00:00"
          }
        ];
        
        // 필터링 적용
        let filteredPrizes = mockPrizes;
        
        if (search) {
          filteredPrizes = filteredPrizes.filter(prize => 
            prize.name.toLowerCase().includes(search.toLowerCase()) ||
            prize.brand.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (type) {
          filteredPrizes = filteredPrizes.filter(prize => prize.prizeType === type);  // 🔄 type → prizeType 변경
        }
        
        if (active !== "") {
          filteredPrizes = filteredPrizes.filter(prize => prize.isActive === (active === "true"));
        }
        
        setPrizes(filteredPrizes);
        setTotalElements(filteredPrizes.length);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("상품 목록 조회 실패:", error);
      alert("상품 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchPrizes();
  }, [fetchPrizes]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchPrizes(0, searchTerm, filterType, filterActive);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const deletePrize = async (id: number) => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;

    try {
      await prizeService.deletePrize(id);
      fetchPrizes(currentPage, searchTerm, filterType, filterActive);
      alert("상품이 삭제되었습니다.");
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      alert("상품 삭제에 실패했습니다.");
    }
  };

  const togglePrizeStatus = async (id: number, currentStatus: boolean) => {
    try {
      await prizeService.togglePrizeStatus(id, !currentStatus);
      fetchPrizes(currentPage, searchTerm, filterType, filterActive);
    } catch (error) {
      console.error("상품 상태 변경 실패:", error);
      alert("상품 상태 변경에 실패했습니다.");
    }
  };

  const renderPaginationButton = (page: number, label?: string) => (
    <button
      key={page}
      onClick={() => fetchPrizes(page, searchTerm, filterType, filterActive)}
      className={`px-3 py-2 text-sm font-medium rounded-md ${
        currentPage === page
          ? "bg-blue-600 text-white"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      {label || (page + 1)}
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
          상품 관리
        </h1>
        <Link
          href="/prizes/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          새 상품 등록
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="상품명, 브랜드로 검색..."
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

          {/* 상품 타입 필터 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="">모든 타입</option>
            <option value="POINT">포인트</option>
            <option value="GIFTICON">기프티콘</option>
            <option value="PHYSICAL">실물</option>
          </select>

          {/* 활성 상태 필터 */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="">모든 상태</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>

          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상품정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  가치
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {prizes.map((prize) => (
                <tr key={prize.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Link href={`/prizes/${prize.id}`}>
                          <img
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                            src={prize.imageUrl}
                            alt={prize.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== DEFAULT_PRIZE_IMAGE) {
                                target.src = DEFAULT_PRIZE_IMAGE;
                              }
                            }}
                          />
                        </Link>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          <Link href={`/prizes/${prize.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                            {prize.name}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {prize.brand}
                        </div>
                        {prize.description && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs truncate">
                            {prize.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getPrizeTypeIcon(prize.prizeType)}  {/* 🔄 type → prizeType 변경 */}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getPrizeTypeLabel(prize.prizeType)}  {/* 🔄 type → prizeType 변경 */}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prize.value === 0 ? (
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        가변 (DB 설정)
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {prize.prizeType === 'POINT' ? `${prize.value}P` : `${prize.value.toLocaleString()}원`}  {/* 🔄 type → prizeType 변경 */}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prize.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {prize.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(prize.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/prizes/${prize.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => togglePrizeStatus(prize.id, prize.isActive)}
                        className={`${
                          prize.isActive
                            ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400'
                        }`}
                      >
                        {prize.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => deletePrize(prize.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {prizes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchTerm || filterType || filterActive ? "검색 조건에 맞는 상품이 없습니다." : "등록된 상품이 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}