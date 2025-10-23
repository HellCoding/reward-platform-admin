"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, Users, Calendar, Settings, BarChart3, Play, Pause } from "lucide-react";
import { timeMissionService, TimeMission, TimeMissionDailyStatus } from "@/services/timeMissionService";
import { formatNumber } from "@/lib/utils";

// Tab 타입 정의
type TabType = 'overview' | 'manage' | 'statistics';

export default function TimeMissionsPage() {
  const [timeMissions, setTimeMissions] = useState<TimeMission[]>([]);
  const [dailyStatus, setDailyStatus] = useState<TimeMissionDailyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [missionsData, statusData] = await Promise.all([
        timeMissionService.getAllTimeMissions(),
        timeMissionService.getDailyStatus(selectedDate)
      ]);
      
      setTimeMissions(missionsData);
      setDailyStatus(statusData);
      
    } catch (error) {
      console.error('타임미션 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleToggleActive = async (mission: TimeMission) => {
    try {
      await timeMissionService.updateTimeMission(mission.id, {
        ...mission,
        isActive: !mission.isActive
      });
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('타임미션 상태 변경 실패:', error);
    }
  };

  const tabs = [
    { key: 'overview', label: '현황 개요', icon: BarChart3 },
    { key: 'manage', label: '미션 관리', icon: Settings },
    { key: 'statistics', label: '통계 분석', icon: BarChart3 },
  ];

  const getStatusBadge = (mission: TimeMission) => {
    if (!mission.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">비활성</span>;
    }
    
    if (mission.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">활성</span>;
    }
    
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">휴무</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">타임미션 관리</h1>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
          <p className="font-medium">오류 발생</p>
          <p className="mt-1 text-sm">{error}</p>
          <button 
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">타임미션 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            시간대별 미션 관리 및 참여 현황 분석
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          
          <button
            onClick={() => {/* TODO: 새 미션 생성 모달 */}}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            <span>새 미션 추가</span>
          </button>
        </div>
      </div>

      {/* 일일 현황 요약 카드 */}
      {dailyStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">총 참여자</h3>
                <p className="text-2xl font-bold mt-1">{formatNumber(dailyStatus.totalParticipants)}명</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Users size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">총 참여횟수</h3>
                <p className="text-2xl font-bold mt-1">{formatNumber(dailyStatus.totalParticipations)}회</p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <Play size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">획득 티켓</h3>
                <p className="text-2xl font-bold mt-1">{formatNumber(dailyStatus.totalEarnedTickets)}장</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Calendar size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">활성 미션</h3>
                <p className="text-2xl font-bold mt-1">
                  {timeMissions.filter(m => m.isActive).length}개
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-6">
        {activeTab === 'overview' && dailyStatus && (
          <div className="space-y-6">
            {/* 세션별 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 size={20} className="mr-2" />
                액션별 참여 현황 ({selectedDate})
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3">미션명</th>
                      <th className="text-center py-3">액션명</th>
                      <th className="text-right py-3">참여자</th>
                      <th className="text-right py-3">참여횟수</th>
                      <th className="text-right py-3">획득티켓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStatus.sessionStatuses && dailyStatus.sessionStatuses.length > 0 ? (
                      dailyStatus.sessionStatuses.map((status, index) => (
                        <tr key={`${status.sessionId}-${index}`} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 font-medium">{status.missionName}</td>
                          <td className="py-3 text-center text-sm">{status.selectedActions || '없음'}</td>
                          <td className="py-3 text-right">{formatNumber(status.participants)}명</td>
                          <td className="py-3 text-right">{formatNumber(status.totalParticipations)}회</td>
                          <td className="py-3 text-right">{formatNumber(status.totalEarnedTickets)}장</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          선택한 날짜에 활성화된 타임미션 세션이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* 미션 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Settings size={20} className="mr-2" />
                타임미션 목록
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3">미션명</th>
                      <th className="text-center py-3">시간대</th>
                      <th className="text-center py-3">게임수</th>
                      <th className="text-center py-3">참여제한</th>
                      <th className="text-center py-3">활성요일</th>
                      <th className="text-center py-3">상태</th>
                      <th className="text-center py-3">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeMissions.map((mission) => (
                      <tr key={mission.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 font-medium">{mission.missionName}</td>
                        <td className="py-3 text-center text-sm">
                          {mission.startTime} - {mission.endTime}
                        </td>
                        <td className="py-3 text-center">{mission.gameCount}개</td>
                        <td className="py-3 text-center">{mission.participationLimitPerGame}회</td>
                        <td className="py-3 text-center text-xs">
                          {mission.activeDaysOfWeek === "1,2,3,4,5,6,7" ? "매일" : 
                           mission.activeDaysOfWeek?.split(',').map(d => 
                             ['', '월', '화', '수', '목', '금', '토', '일'][parseInt(d)]
                           ).join(',')}
                        </td>
                        <td className="py-3 text-center">
                          {getStatusBadge(mission)}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleToggleActive(mission)}
                              className={`p-1 rounded-md ${
                                mission.isActive 
                                  ? 'text-red-600 hover:bg-red-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={mission.isActive ? '비활성화' : '활성화'}
                            >
                              {mission.isActive ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                              onClick={() => {/* TODO: 수정 모달 */}}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
                              title="수정"
                            >
                              <Settings size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 size={20} className="mr-2" />
                통계 분석
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                타임미션 통계 분석 기능은 추후 구현 예정입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
