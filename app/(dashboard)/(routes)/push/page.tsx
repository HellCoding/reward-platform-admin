"use client";

import { 
  Send, 
  Clock, 
  History, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import pushService, { 
  PushDashboardStats, 
  PushScheduleResponse, 
  PushBroadcastHistoryResponse 
} from "@/services/pushService";

export default function PushPage() {
  const [stats, setStats] = useState<PushDashboardStats>({
    todaySent: 0,
    pendingSchedules: 0,
    totalSchedules: 0,
    weekSent: 0
  });
  const [recentSchedules, setRecentSchedules] = useState<PushScheduleResponse[]>([]);
  const [recentHistory, setRecentHistory] = useState<PushBroadcastHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 병렬로 데이터 로드
        const [dashboardStats, schedules, history] = await Promise.all([
          pushService.getDashboardStats(),
          pushService.getRecentSchedules(),
          pushService.getRecentHistory()
        ]);

        setStats(dashboardStats);
        setRecentSchedules(schedules);
        setRecentHistory(history);
      } catch (err) {
        console.error('Failed to fetch push dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickStats = [
    {
      title: "오늘 발송",
      value: loading ? "..." : stats.todaySent.toString(),
      icon: Send,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "대기중 예약",
      value: loading ? "..." : stats.pendingSchedules.toString(),
      icon: Clock,
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
    },
    {
      title: "총 예약",
      value: loading ? "..." : stats.totalSchedules.toString(),
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "이번 주 발송",
      value: loading ? "..." : stats.weekSent.toString(),
      icon: History,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];



  const getStatusBadge = (schedule: PushScheduleResponse) => {
    if (schedule.canceled) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={12} className="mr-1" />
          취소
        </span>
      );
    }
    
    if (schedule.executed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          완료
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle size={12} className="mr-1" />
        대기중
      </span>
    );
  };

  const getNotificationTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
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
    return types[type] || type;
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">푸시 알림 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            즉시 발송, 예약 발송 및 발송 이력을 관리합니다
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-md`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">빠른 작업</h3>
          </div>
          <div className="space-y-3">
            <Link 
              href="/push/broadcast"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Send size={20} className="text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">즉시 발송</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">지금 바로 푸시 알림 발송</p>
              </div>
            </Link>
            <Link 
              href="/push/schedule"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Clock size={20} className="text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">예약 발송</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">특정 시간에 발송 예약</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">최근 예약</h3>
            <Link 
              href="/push/scheduled"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                데이터를 불러오는 중...
              </div>
            ) : recentSchedules.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                예약된 푸시가 없습니다.
              </div>
            ) : (
              recentSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{schedule.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDateTime(schedule.scheduledAt)} • {getNotificationTypeLabel(schedule.notificationType)}
                    </p>
                  </div>
                  {getStatusBadge(schedule)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">최근 발송 이력</h3>
          <Link 
            href="/push/history"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            전체 이력 보기
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  발송 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  발송률
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : recentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    발송 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                recentHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(item.sentAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {getNotificationTypeLabel(item.notificationType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((item.sentDeviceCount / (item.eligibleUserCount || 1)) * 100)}% ({item.sentDeviceCount}/{item.eligibleUserCount || 0})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
