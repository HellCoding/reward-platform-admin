"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  Users,
  Send,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import pushService, { PushBroadcastHistoryResponse, PageResponse } from "@/services/pushService";

export default function HistoryPage() {
  const [history, setHistory] = useState<PageResponse<PushBroadcastHistoryResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const notificationTypes = [
    { value: '', label: '전체 타입' },
    { value: 'TICKET_GET', label: '티켓 획득 가능' },
    { value: 'WINNER_BOX', label: '셔플박스 당첨' },
    { value: 'WINNER_LUCKY', label: '셔플뽑기 당첨' },
    { value: 'INVITE_FRIEND', label: '친구 초대 보상' },
    { value: 'INVITE_MILESTONE_5', label: '5명 초대 마일스톤' },
    { value: 'INVITE_MILESTONE_10', label: '10명 초대 마일스톤' },
    { value: 'EXTINCT_TICKET', label: '티켓 소멸 예정' },
    { value: 'EXTINCT_POINT', label: '포인트 소멸 예정' },
    { value: 'NOTICE', label: '공지사항' },
  ];

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await pushService.getPushBroadcastHistory(currentPage, 20);
      setHistory(response);
    } catch (error) {
      console.error('발송 이력 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredHistory = async () => {
    try {
      setIsFiltering(true);
      
      let response: PageResponse<PushBroadcastHistoryResponse> | PushBroadcastHistoryResponse[];
      
      if (startDate && endDate) {
        // 기간별 조회
        const results = await pushService.getPushBroadcastHistoryByPeriod(startDate, endDate);
        response = {
          content: results,
          totalElements: results.length,
          totalPages: 1,
          size: results.length,
          number: 0,
          first: true,
          last: true,
          empty: results.length === 0
        };
      } else if (selectedType) {
        // 타입별 조회
        const results = await pushService.getPushBroadcastHistoryByType(selectedType as keyof import("@/services/pushService").NotificationType);
        response = {
          content: results,
          totalElements: results.length,
          totalPages: 1,
          size: results.length,
          number: 0,
          first: true,
          last: true,
          empty: results.length === 0
        };
      } else {
        // 일반 조회
        response = await pushService.getPushBroadcastHistory(currentPage, 20);
      }
      
      setHistory(response as PageResponse<PushBroadcastHistoryResponse>);
    } catch (error) {
      console.error('필터링된 이력 조회 실패:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate || selectedType) {
      fetchFilteredHistory();
    } else {
      fetchHistory();
    }
  }, [currentPage]);

  const handleFilter = () => {
    setCurrentPage(0);
    fetchFilteredHistory();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('');
    setSearchTerm('');
    setCurrentPage(0);
    fetchHistory();
  };

  const getSuccessRate = (item: PushBroadcastHistoryResponse) => {
    // eligibleUserCount (실제 발송 대상자)를 분모로 사용
    if (!item.eligibleUserCount || item.eligibleUserCount === 0) return 0;
    return Math.round((item.sentDeviceCount / item.eligibleUserCount) * 100);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch {
      return '-';
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const filteredHistory = history?.content?.filter(item => {
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.body.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const getTypeLabel = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/push"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            푸시 알림 관리
          </Link>
          <div className="text-gray-400">/</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">발송 이력</h1>
        </div>
        
        <button
          onClick={fetchHistory}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          새로고침
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Filter size={16} className="text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">필터 및 검색</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 기간 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              시작 날짜
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              종료 날짜
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {/* 타입 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              알림 타입
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              검색
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제목이나 내용으로 검색"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={handleFilter}
            disabled={isFiltering}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isFiltering && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            필터 적용
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {history && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <Send size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 발송 건수</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(history.totalElements)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                <Users size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 발송률</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {history.content.length > 0 
                    ? Math.round(
                        history.content
                          .filter(item => item.eligibleUserCount && item.eligibleUserCount > 0)
                          .reduce((sum, item) => sum + getSuccessRate(item), 0) / 
                        Math.max(history.content.filter(item => item.eligibleUserCount && item.eligibleUserCount > 0).length, 1)
                      ) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                <Calendar size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">이번 주 발송</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return history.content.filter(item => {
                      if (!item.sentAt) return false;
                      try {
                        return new Date(item.sentAt) >= oneWeekAgo;
                      } catch {
                        return false;
                      }
                    }).length;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 발송 이력 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center">
            <History size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">발송 이력이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    발송 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    대상자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    발송률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    테스트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {item.body}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {getTypeLabel(item.notificationType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.sentAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        총 {formatNumber(item.totalUserCount)}명
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        활성 {formatNumber(item.eligibleUserCount)}명
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatNumber(item.sentDeviceCount)}대
                        </div>
                        <div className={`ml-2 text-sm font-semibold ${getSuccessRateColor(getSuccessRate(item))}`}>
                          ({getSuccessRate(item)}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.testMode ? (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">테스트</span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">실제</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // 상세 모달이나 페이지로 이동
                            console.log('상세 보기:', item.id);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="상세 보기"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            // 데이터 다운로드
                            console.log('다운로드:', item.id);
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="데이터 다운로드"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {history && history.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                총 {formatNumber(history.totalElements)}개의 이력 중 {(currentPage * 20) + 1}-{Math.min((currentPage + 1) * 20, history.totalElements || 0)}개 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {currentPage + 1} / {history.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(history.totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= history.totalPages - 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
