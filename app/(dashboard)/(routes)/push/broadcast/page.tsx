"use client";

import { useState } from "react";
import { Send, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import pushService, { BroadcastPushRequest, PushBroadcastResultResponse } from "@/services/pushService";

export default function BroadcastPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BroadcastPushRequest>({
    title: "",
    body: "",
    notificationType: "NOTICE",
    actionTarget: "",
    testMode: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<PushBroadcastResultResponse | null>(null);

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요";
    } else if (formData.title.length > 100) {
      newErrors.title = "제목은 100자 이내로 입력해주세요";
    }

    if (!formData.body.trim()) {
      newErrors.body = "내용을 입력해주세요";
    } else if (formData.body.length > 500) {
      newErrors.body = "내용은 500자 이내로 입력해주세요";
    }

    if (!formData.notificationType) {
      newErrors.notificationType = "알림 타입을 선택해주세요";
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
      setIsLoading(true);
      const response = await pushService.broadcastPush(formData);
      setResult(response);
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "발송 중 오류가 발생했습니다"
        : "발송 중 오류가 발생했습니다";
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BroadcastPushRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // 결과 화면
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/push"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            푸시 알림 관리로 돌아가기
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              푸시 알림 발송 완료
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {formData.testMode ? "테스트 모드로 발송되었습니다" : "모든 사용자에게 발송되었습니다"}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">발송 결과</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 사용자 수</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.totalUserCount?.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">푸시 활성 사용자</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.eligibleUserCount?.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">발송된 디바이스</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.sentDeviceCount?.toLocaleString()}대
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">발송률</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(result.eligibleUserCount || 0) > 0 
                      ? Math.round((result.sentDeviceCount / result.eligibleUserCount) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">발송 내용</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">제목</p>
                  <p className="text-gray-900 dark:text-white">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">내용</p>
                  <p className="text-gray-900 dark:text-white">{formData.body}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">발송 시간</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(result.sentAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => {
                setResult(null);
                setFormData({
                  title: "",
                  body: "",
                  notificationType: "NOTICE",
                  actionTarget: "",
                  testMode: false,
                });
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              다시 발송하기
            </button>
            <Link
              href="/push/history"
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              발송 이력 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href="/push"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} className="mr-2" />
          푸시 알림 관리
        </Link>
        <div className="text-gray-400">/</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">즉시 발송</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
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
              {formData.title.length}/100자
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
              {formData.body.length}/500자
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

          {/* 테스트 모드 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="testMode"
              checked={formData.testMode}
              onChange={(e) => handleInputChange('testMode', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="testMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              테스트 모드 (실제 발송하지 않음)
            </label>
          </div>

          {/* 경고 메시지 */}
          {!formData.testMode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle size={20} className="text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    주의사항
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <p>
                      • 모든 사용자에게 푸시 알림이 발송됩니다<br/>
                      • 발송 후에는 취소할 수 없습니다<br/>
                      • 테스트를 원하신다면 테스트 모드를 체크해주세요
                    </p>
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
              href="/push"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Send size={16} className="mr-2" />
              {formData.testMode ? "테스트 발송" : "즉시 발송"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
