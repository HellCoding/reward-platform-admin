"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import pushService, { PushScheduleUpdateRequest, PushScheduleResponse } from "@/services/pushService";

export default function EditSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = Number(params.id);
  
  const [originalSchedule, setOriginalSchedule] = useState<PushScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PushScheduleUpdateRequest>({
    title: "",
    body: "",
    notificationType: "NOTICE",
    actionTarget: "",
    scheduledAt: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<PushScheduleResponse | null>(null);

  const notificationTypes = [
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

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const schedule = await pushService.getSchedule(scheduleId);
      
      // 수정 불가능한 상태인지 확인
      if (schedule.executed || schedule.canceled) {
        router.push(`/push/scheduled/${scheduleId}`);
        return;
      }
      
      setOriginalSchedule(schedule);
      
      // 폼 데이터 설정
      setFormData({
        title: schedule.title,
        body: schedule.body,
        notificationType: schedule.notificationType,
        actionTarget: schedule.actionTarget || "",
        scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt).toISOString().slice(0, 16) : "",
      });
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title?.trim()) {
      newErrors.title = "제목을 입력해주세요";
    } else if (formData.title.length > 100) {
      newErrors.title = "제목은 100자 이내로 입력해주세요";
    }

    if (!formData.body?.trim()) {
      newErrors.body = "내용을 입력해주세요";
    } else if (formData.body.length > 500) {
      newErrors.body = "내용은 500자 이내로 입력해주세요";
    }

    if (!formData.notificationType) {
      newErrors.notificationType = "알림 타입을 선택해주세요";
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = "예약 시간을 선택해주세요";
    } else {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduledAt = "예약 시간은 현재 시간 이후여야 합니다";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await pushService.updateSchedule(scheduleId, formData);
      setResult(response);
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "수정 중 오류가 발생했습니다"
        : "수정 중 오류가 발생했습니다";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PushScheduleUpdateRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // 최소 날짜/시간 설정 (현재 시간 + 5분)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const hasChanges = () => {
    if (!originalSchedule) return false;
    
    return (
      formData.title !== originalSchedule.title ||
      formData.body !== originalSchedule.body ||
      formData.notificationType !== originalSchedule.notificationType ||
      formData.actionTarget !== (originalSchedule.actionTarget || "") ||
      formData.scheduledAt !== new Date(originalSchedule.scheduledAt).toISOString().slice(0, 16)
    );
  };

  // 성공 화면
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/push/scheduled/${scheduleId}`}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            예약 상세로 돌아가기
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              예약 수정 완료
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              예약이 성공적으로 수정되었습니다
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">수정된 예약 정보</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">예약 ID</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">#{result.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">제목</p>
                  <p className="text-gray-900 dark:text-white">{result.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">예약 시간</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(result.scheduledAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">수정 시간</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(result.updatedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href={`/push/scheduled/${scheduleId}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              상세 보기
            </Link>
            <Link
              href="/push/scheduled"
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              예약 목록
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!originalSchedule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">예약을 찾을 수 없거나 수정할 수 없는 상태입니다.</p>
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href={`/push/scheduled/${scheduleId}`}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} className="mr-2" />
          예약 상세
        </Link>
        <div className="text-gray-400">/</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">예약 수정</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            예약 ID #{originalSchedule.id} 수정
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            생성: {new Date(originalSchedule.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                errors.title 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
              placeholder="푸시 알림 제목을 입력하세요"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.title?.length || 0}/100자
            </p>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                errors.body 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
              placeholder="푸시 알림 내용을 입력하세요"
              maxLength={500}
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.body}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.body?.length || 0}/500자
            </p>
          </div>

          {/* 알림 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              알림 타입 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.notificationType}
              onChange={(e) => handleInputChange('notificationType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                errors.notificationType 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.notificationType && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notificationType}</p>
            )}
          </div>

          {/* 예약 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              예약 시간 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              min={getMinDateTime()}
              onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                errors.scheduledAt 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduledAt}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              현재 시간 이후의 시간을 선택해주세요
            </p>
          </div>

          {/* 액션 타겟 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              클릭 시 이동할 경로 (선택사항)
            </label>
            <input
              type="text"
              value={formData.actionTarget}
              onChange={(e) => handleInputChange('actionTarget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:border-blue-500"
              placeholder="/event/123, /action/4 등"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              푸시 알림 클릭 시 앱에서 이동할 경로를 입력하세요
            </p>
          </div>

          {/* 테스트 모드 표시 (수정 불가) */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                테스트 모드
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                originalSchedule.testMode 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {originalSchedule.testMode ? '테스트 모드' : '실제 발송'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              테스트 모드는 수정할 수 없습니다
            </p>
          </div>

          {/* 변경사항 알림 */}
          {hasChanges() && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle size={20} className="text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    변경사항이 있습니다
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>수정된 내용으로 예약이 업데이트됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/push/scheduled/${scheduleId}`}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSaving || !hasChanges()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Save size={16} className="mr-2" />
              변경사항 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
