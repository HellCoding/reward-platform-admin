"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import pushService, { PushScheduleResponse, PageResponse } from "@/services/pushService";

export default function ScheduledPage() {
  const [schedules, setSchedules] = useState<PageResponse<PushScheduleResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'executed', label: '실행완료' },
    { value: 'canceled', label: '취소됨' },
  ];

  const notificationTypes: { [key: string]: string } = {
    'TICKET_GET': '티켓 획득',
    'WINNER_BOX': '박스 당첨',
    'WINNER_LUCKY': '뽑기 당첨',
    'INVITE_FRIEND': '친구 초대',
    'INVITE_MILESTONE_5': '5명 초대 달성',
    'INVITE_MILESTONE_10': '10명 초대 달성',
    'EXTINCT_TICKET': '티켓 소멸 예정',
    'EXTINCT_POINT': '포인트 소멸 예정',
    'NOTICE': '공지사항',
  };

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await pushService.getSchedules(statusFilter, currentPage, 20);
      setSchedules(response);
    } catch (error) {
      console.error('예약 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentPage, statusFilter]);

  const getStatusBadge = (schedule: PushScheduleResponse) => {
    if (schedule.canceled) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={12} className="mr-1" />
          취소됨
        </span>
      );
    }
    
    if (schedule.executed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          실행완료
        </span>
      );
    }

    const now = new Date();
    const scheduledTime = new Date(schedule.scheduledAt);
    
    if (scheduledTime <= now) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle size={12} className="mr-1" />
          실행대기
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle size={12} className="mr-1" />
        예약됨
      </span>
    );
  };

  const handleCancelSchedule = async (scheduleId: number) => {
    if (!cancelReason.trim()) {
      setErrors({ cancelReason: "취소 사유를 입력해주세요" });
      return;
    }

    try {
      await pushService.cancelSchedule(scheduleId, { cancelReason });
      setCancelingId(null);
      setCancelReason('');
      setErrors({});
      fetchSchedules(); // 목록 새로고침
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "취소 중 오류가 발생했습니다"
        : "취소 중 오류가 발생했습니다";
      setErrors({ submit: errorMessage });
    }
  };

  const filteredSchedules = schedules?.content?.filter(schedule => {
    if (!searchTerm) return true;
    return schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           schedule.body.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const canEdit = (schedule: PushScheduleResponse) => {
    return !schedule.executed && !schedule.canceled;
  };

  const canCancel = (schedule: PushScheduleResponse) => {
    return !schedule.executed && !schedule.canceled;
  };

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">예약 목록</h1>
        </div>
        <Link
          href="/push/schedule"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          새 예약 만들기
        </Link>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목이나 내용으로 검색..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white w-64"
            />
          </div>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">예약된 푸시 알림이 없습니다</p>
            <Link
              href="/push/schedule"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              첫 예약 만들기
            </Link>
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
                    예약 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
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
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {schedule.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {schedule.body}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {notificationTypes[schedule.notificationType] || schedule.notificationType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(schedule.scheduledAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(schedule)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {schedule.testMode ? (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">테스트</span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">실제</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/push/scheduled/${schedule.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="상세 보기"
                        >
                          <Eye size={16} />
                        </Link>
                        {canEdit(schedule) && (
                          <Link
                            href={`/push/scheduled/${schedule.id}/edit`}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="수정"
                          >
                            <Edit size={16} />
                          </Link>
                        )}
                        {canCancel(schedule) && (
                          <button
                            onClick={() => setCancelingId(schedule.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="취소"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {schedules && schedules.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                총 {schedules.totalElements}개의 예약 중 {(currentPage * 20) + 1}-{Math.min((currentPage + 1) * 20, schedules.totalElements)}개 표시
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
                  {currentPage + 1} / {schedules.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(schedules.totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= schedules.totalPages - 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 취소 모달 */}
      {cancelingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              예약 취소
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              이 예약을 취소하시겠습니까? 취소 후에는 복구할 수 없습니다.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                취소 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (errors.cancelReason) {
                    setErrors(prev => ({ ...prev, cancelReason: "" }));
                  }
                }}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                  errors.cancelReason 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder="취소 사유를 입력해주세요"
              />
              {errors.cancelReason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cancelReason}</p>
              )}
            </div>
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCancelingId(null);
                  setCancelReason('');
                  setErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                닫기
              </button>
              <button
                onClick={() => handleCancelSchedule(cancelingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
