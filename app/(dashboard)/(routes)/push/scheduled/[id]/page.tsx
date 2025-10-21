"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  MessageSquare,
  Clock,
  User,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import pushService, { PushScheduleResponse } from "@/services/pushService";

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = Number(params.id);
  
  const [schedule, setSchedule] = useState<PushScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCanceling, setIsCanceling] = useState(false);

  const notificationTypes: { [key: string]: string } = {
    'TICKET_GET': '티켓 획득 가능',
    'WINNER_BOX': '셔플박스 당첨',
    'WINNER_LUCKY': '셔플뽑기 당첨',
    'INVITE_FRIEND': '친구 초대 보상',
    'INVITE_MILESTONE_5': '5명 초대 마일스톤',
    'INVITE_MILESTONE_10': '10명 초대 마일스톤',
    'EXTINCT_TICKET': '티켓 소멸 예정',
    'EXTINCT_POINT': '포인트 소멸 예정',
    'NOTICE': '공지사항',
  };

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await pushService.getSchedule(scheduleId);
      setSchedule(response);
    } catch (error) {
      console.error('예약 상세 조회 실패:', error);
      if (error instanceof Error && 'response' in error && 
          (error as { response?: { status?: number } }).response?.status === 404) {
        router.push('/push/scheduled');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
    }
  }, [scheduleId]);

  const getStatusInfo = (schedule: PushScheduleResponse) => {
    if (schedule.canceled) {
      return {
        badge: (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle size={16} className="mr-1" />
            취소됨
          </span>
        ),
        description: "이 예약은 취소되었습니다."
      };
    }
    
    if (schedule.executed) {
      return {
        badge: (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="mr-1" />
            실행완료
          </span>
        ),
        description: "예약이 성공적으로 실행되었습니다."
      };
    }

    const now = new Date();
    const scheduledTime = new Date(schedule.scheduledAt);
    
    if (scheduledTime <= now) {
      return {
        badge: (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <AlertCircle size={16} className="mr-1" />
            실행대기
          </span>
        ),
        description: "예약 시간이 지났으며 곧 실행될 예정입니다."
      };
    }

    return {
      badge: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle size={16} className="mr-1" />
          예약됨
        </span>
      ),
      description: "예약된 시간에 실행될 예정입니다."
    };
  };

  const handleCancelSchedule = async () => {
    if (!cancelReason.trim()) {
      setErrors({ cancelReason: "취소 사유를 입력해주세요" });
      return;
    }

    try {
      setIsCanceling(true);
      await pushService.cancelSchedule(scheduleId, { cancelReason });
      setShowCancelModal(false);
      setCancelReason('');
      setErrors({});
      fetchSchedule(); // 상세정보 새로고침
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "취소 중 오류가 발생했습니다"
        : "취소 중 오류가 발생했습니다";
      setErrors({ submit: errorMessage });
    } finally {
      setIsCanceling(false);
    }
  };

  const canEdit = (schedule: PushScheduleResponse) => {
    return !schedule.executed && !schedule.canceled;
  };

  const canCancel = (schedule: PushScheduleResponse) => {
    return !schedule.executed && !schedule.canceled;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">예약을 찾을 수 없습니다.</p>
        <Link 
          href="/push/scheduled"
          className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" />
          예약 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(schedule);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/push/scheduled"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            예약 목록
          </Link>
          <div className="text-gray-400">/</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            예약 상세 정보
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {canEdit(schedule) && (
            <Link
              href={`/push/scheduled/${schedule.id}/edit`}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Edit size={16} className="mr-2" />
              수정
            </Link>
          )}
          {canCancel(schedule) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} className="mr-2" />
              취소
            </button>
          )}
        </div>
      </div>

      {/* 상태 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                예약 상태
              </h2>
              {statusInfo.badge}
            </div>
            <p className="text-gray-600 dark:text-gray-400">{statusInfo.description}</p>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            <p>예약 ID: #{schedule.id}</p>
            <p>생성: {new Date(schedule.createdAt).toLocaleString('ko-KR')}</p>
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <MessageSquare size={20} className="mr-2" />
          발송 내용
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                제목
              </label>
              <p className="text-gray-900 dark:text-white">{schedule.title}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                내용
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{schedule.body}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                알림 타입
              </label>
              <p className="text-gray-900 dark:text-white">
                {notificationTypes[schedule.notificationType] || schedule.notificationType}
              </p>
            </div>
            
            {schedule.actionTarget && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  액션 타겟
                </label>
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {schedule.actionTarget}
                  </code>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                모드
              </label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                schedule.testMode 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {schedule.testMode ? '테스트 모드' : '실제 발송'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 스케줄 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Clock size={20} className="mr-2" />
          시간 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              예약 시간
            </label>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <p className="text-gray-900 dark:text-white">
                {new Date(schedule.scheduledAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              생성 시간
            </label>
            <p className="text-gray-900 dark:text-white">
              {new Date(schedule.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              마지막 수정
            </label>
            <p className="text-gray-900 dark:text-white">
              {new Date(schedule.updatedAt).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 실행 결과 (실행된 경우) */}
      {schedule.executed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <CheckCircle size={20} className="mr-2 text-green-600" />
            실행 결과
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                실행 시간
              </label>
              <p className="text-gray-900 dark:text-white">
                {schedule.executionTime ? new Date(schedule.executionTime).toLocaleString('ko-KR') : '-'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                브로드캐스트 ID
              </label>
              <p className="text-gray-900 dark:text-white">
                {schedule.broadcastId ? `#${schedule.broadcastId}` : '-'}
              </p>
            </div>
          </div>
          
          {schedule.broadcastId && (
            <div className="mt-4">
              <Link
                href={`/push/history`}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                발송 이력에서 자세히 보기
                <ExternalLink size={14} className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 취소 정보 (취소된 경우) */}
      {schedule.canceled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <XCircle size={20} className="mr-2 text-red-600" />
            취소 정보
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              취소 사유
            </label>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-red-800 dark:text-red-200">
                {schedule.cancelReason || '사유가 기록되지 않았습니다.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 생성자 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <User size={20} className="mr-2" />
          관리자 정보
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            생성자
          </label>
          <p className="text-gray-900 dark:text-white">
            {schedule.createdBy || '알 수 없음'}
          </p>
        </div>
      </div>

      {/* 취소 모달 */}
      {showCancelModal && (
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
                  setShowCancelModal(false);
                  setCancelReason('');
                  setErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isCanceling}
              >
                닫기
              </button>
              <button
                onClick={handleCancelSchedule}
                disabled={isCanceling}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCanceling && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
