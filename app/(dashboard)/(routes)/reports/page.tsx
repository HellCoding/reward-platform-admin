"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw, Users, Package, DollarSign, UserCheck, TrendingUp, Activity, PlayCircle, Download, Clock } from "lucide-react";
import { reportService } from "@/services/api";
import { formatNumber } from "@/lib/utils";

// Tab 타입 정의
type TabType = 'summary' | 'users' | 'tickets' | 'points' | 'boxes' | 'draws' | 'pointmall' | 'timemissions';

// 🔇 실시간 데이터 타입 정의 (비활성화)
// interface RealtimeData {
//   activeUsers: number;
//   todayNewUsers: number;
//   todayTicketsIssued: number;
//   todayPointsUsed: number;
//   lastUpdated: string;
// }

// API 응답 타입 정의
interface ReportData {
  reportDate: string;
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    unusedPoints: number;
    inviteUsers: number;
    ticketEarned: number;
    ticketUsed: number;
    ticketExpired: number;
    pointEarned: number;
    pointUsed: number;
    pointExpiredToday: number;     // 🆕 당일 소멸 포인트
    totalPointExpired: number;     // 🆕 총 소멸 포인트 (누적)
  };
  userStats: {
    prevTotalUsers: number;
    newUsers: number;
    withdrawnUsers: number;
    incompleteUsers: number;
    totalUsers: number;
  };
  ticketStats: {
    issueCount: number;
    issueTotal: number;
    issueBySource: Array<{
      sourceType: string;
      description: string;
      count: number;
      total: number;
      isExtraChance?: boolean;  // 🆕 추가기회 여부
    }>;
    bronzeUsageCount: number;
    bronzeUsageTickets: number;
    silverUsageCount: number;
    silverUsageTickets: number;
  };
  pointStats: {
    issueCount: number;
    issueTotal: number;
    boxCount?: number;         // 선택적 필드로 변경
    drawCount?: number;        // 선택적 필드로 변경
    inviteCount?: number;      // 친구초대 포인트 건수 (선택적)
    boxPoints: number;
    drawPoints: number;
    invitePoints?: number;     // 친구초대 포인트 총액 (선택적)
    inviteNormalCount?: number; // 일반 친구초대 건수 (선택적)
    inviteBonusCount?: number;  // 5명 달성 보너스 건수 (선택적)
    inviteNormalPoints?: number; // 일반 친구초대 포인트 (선택적)
    inviteBonusPoints?: number;  // 5명 달성 보너스 포인트 (선택적)
    drawUsageCount: number;
    drawUsagePoints: number;
    mallUsageCount: number;
    mallUsagePoints: number;
  };
  boxStats: {
    bronzeWinnings: Array<{
      type: string;
      count: number;
      points: number;
    }>;
    silverWinnings: Array<{
      type: string;
      count: number;
      points: number;
    }>;
    welcomeWinnings?: Array<{
      type: string;
      count: number;
      points: number;
    }>;
    detailedWinnings: Array<{
      boxType: string;
      prizeName: string;
      count: number;
      points: number;
      setProbability: number;
      actualProbability: number;
    }>;
  };
  drawStats: {
    participation: Array<{
      drawName: string;
      count: number;
      points: number;
    }>;
    winnings: Array<{
      drawType: string;
      prizeName: string;
      count: number;
      points: number;
    }>;
  };
  pointMallStats: {
    gifticonCount: number;
    gifticonPoints: number;
    physicalCount: number;
    physicalPoints: number;
  };
  timeMissionStats?: {
    data: Array<{
      sessionDisplayName?: string;
      missionName: string;
      sessionDate?: string;
      sessionId?: number;
      selectedActions: string;
      participantCount: number;
      participationCount: number;
      ticketsEarned: number;
      successRate?: number;
    }>;
    hasData: boolean;
  };
  adStats?: Array<{  // 🆕 게임별 추가참여 광고 현황
    actionName: string;
    watchCount: number;
    extraChanceGames: number;
    actualTickets: number;
  }>;
}

// 컴포넌트 Props 인터페이스
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  suffix?: string;
  format?: boolean;
  color?: string;
}

const StatCard = ({ title, value, icon: Icon, suffix = "", format = true, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold mt-1">
            {format ? formatNumber(value) : value}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};


export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  // 🔇 실시간 데이터 관련 state (비활성화)
  // const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('yesterday');
  const [customDate, setCustomDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  // 🆕 CSV 다운로드 관련 state
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // 중복 API 호출 방지를 위한 참조 변수
  const isLoadingRef = useRef(false);

  // 🔇 실시간 데이터 조회 함수 (비활성화)
  // const fetchRealtimeData = useCallback(async () => {
  //   try {
  //     setRealtimeLoading(true);
  //     
  //     // 오늘 현황을 실시간 데이터로 사용
  //     const todayReport = await reportService.getTodayReport();
  //     
  //     setRealtimeData({
  //       activeUsers: todayReport.summary.activeUsers,
  //       todayNewUsers: todayReport.userStats.newUsers,
  //       todayTicketsIssued: todayReport.summary.ticketEarned,
  //       todayPointsUsed: todayReport.summary.pointUsed,
  //       lastUpdated: new Date().toISOString()
  //     });
  //   } catch (error) {
  //     console.error('실시간 데이터 조회 실패:', error);
  //     // 실시간 데이터 조회 실패는 에러로 처리하지 않음 (기본 리포트 데이터는 유지)
  //   } finally {
  //     setRealtimeLoading(false);
  //   }
  // }, []);

  // 🔇 타임미션 데이터 조회 함수 (비활성화 - DailyReport에서 통합 처리)
  // const fetchTimeMissionData = async (dateType: string, customDateValue?: string) => {
  //   try {
  //     setTimeMissionLoading(true);
  //     setTimeMissionError(null);
  //     
  //     let targetDate: string;
  //     
  //     switch (dateType) {
  //       case 'today':
  //         targetDate = new Date().toISOString().split('T')[0];
  //         break;
  //       case 'yesterday':
  //         const yesterday = new Date();
  //         yesterday.setDate(yesterday.getDate() - 1);
  //         targetDate = yesterday.toISOString().split('T')[0];
  //         break;
  //       case 'custom':
  //         if (customDateValue) {
  //           targetDate = customDateValue;
  //         } else {
  //           throw new Error('날짜를 선택해주세요.');
  //         }
  //         break;
  //       default:
  //         const defaultYesterday = new Date();
  //         defaultYesterday.setDate(defaultYesterday.getDate() - 1);
  //         targetDate = defaultYesterday.toISOString().split('T')[0];
  //     }
  //     
  //     console.log(`타임미션 현황 API 호출 중: ${targetDate}`);
  //     const timeMissionResponse = await timeMissionService.getTimeMissionReport(targetDate);
  //     console.log('✅ 타임미션 현황 API 호출 성공:', timeMissionResponse);
  //     setTimeMissionData(timeMissionResponse);
  //     
  //   } catch (error: unknown) {
  //     console.error('❌ 타임미션 현황 로드 실패:', error);
  //     const errorMessage = error instanceof Error ? error.message : '타임미션 현황을 불러오는 데 실패했습니다.';
  //     setTimeMissionError(errorMessage);
  //   } finally {
  //     setTimeMissionLoading(false);
  //   }
  // };

  const fetchReport = async (dateType: string, customDateValue?: string) => {
    // 요청 키 생성 (추후 중복 방지 로직에 사용 예정)
    // const requestKey = `${dateType}-${customDateValue || 'default'}`;
    
    // 간단한 중복 방지 로직 (isLoadingRef만 사용)
    if (isLoadingRef.current) {
      console.log(`이미 처리 중입니다. 중복 실행 방지.`);
      return;
    }

    try {
      console.log(`✅ fetchReport 실행 시작: ${dateType}-${customDateValue || 'default'}`);
      console.log('현재 토큰:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      
      setLoading(true);
      isLoadingRef.current = true; // 로딩 중 플래그 설정
      setError(null);
      
      let reportResponse;
      
      switch (dateType) {
        case 'today':
          console.log('오늘 리포트 API 호출 중...');
          reportResponse = await reportService.getTodayReport();
          break;
        case 'yesterday':
          console.log('어제 리포트 API 호출 중...');
          reportResponse = await reportService.getYesterdayReport();
          break;
        case 'custom':
          if (customDateValue) {
            console.log(`커스텀 날짜 리포트 API 호출 중: ${customDateValue}`);
            reportResponse = await reportService.getDailyReport(customDateValue);
          } else {
            throw new Error('날짜를 선택해주세요.');
          }
          break;
        default:
          console.log('기본(어제) 리포트 API 호출 중...');
          reportResponse = await reportService.getYesterdayReport();
      }
      
      console.log('✅ Daily Report API 호출 성공:', reportResponse);
      
      // DailyReportResponse를 ReportData로 변환
      const transformedData: ReportData = {
        ...reportResponse,
        boxStats: {
          ...reportResponse.boxStats,
          detailedWinnings: reportResponse.boxStats.detailedWinnings || []
        }
      };
      
      setReportData(transformedData);
      
    } catch (error: unknown) {
      console.error('❌ Daily Report 로드 실패:', error);
      
      // 더 자세한 에러 정보 출력
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Daily Report를 불러오는 데 실패했습니다.';
      setError(errorMessage);
    } finally {
      console.log('fetchReport finally 블록 실행');
      setLoading(false);
      isLoadingRef.current = false; // 로딩 완료 플래그 정리
    }
  };

  useEffect(() => {
    console.log("Reports 페이지 초기화");
    
    // 초기 데이터 로드
    fetchReport('yesterday');
    
    // 5분마다 자동 갱신 설정
    const reportInterval = setInterval(() => {
      if (selectedDate === 'today') {
        fetchReport('today');
      }
    }, 300000);

    // cleanup 함수
    return () => {
      clearInterval(reportInterval);
    };
  }, [selectedDate]); // selectedDate 의존성 추가

  const handleDateChange = (dateType: string) => {
    setSelectedDate(dateType);
    if (dateType !== 'custom') {
      fetchReport(dateType);
      // 🔇 실시간 데이터 갱신 비활성화
      // if (dateType === 'today') {
      //   fetchRealtimeData();
      // }
    }
  };

  const handleCustomDateSubmit = () => {
    if (customDate) {
      fetchReport('custom', customDate);
    }
  };

  const handleRefresh = () => {
    fetchReport(selectedDate, customDate);
    // 🔇 실시간 데이터 갱신 비활성화
    // fetchRealtimeData();
  };

  // 🆕 CSV 다운로드 핸들러
  const handleDownloadCsv = async () => {
    if (!reportData) {
      setDownloadError('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadError(null);
      
      let downloadDate: string | undefined;
      
      if (selectedDate === 'today') {
        downloadDate = new Date().toISOString().split('T')[0];
      } else if (selectedDate === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        downloadDate = yesterday.toISOString().split('T')[0];
      } else if (selectedDate === 'custom' && customDate) {
        downloadDate = customDate;
      } else {
        downloadDate = reportData.reportDate;
      }
      
      await reportService.downloadDailyReportCsv(downloadDate);
      
      console.log('CSV 다운로드 완료:', downloadDate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'CSV 다운로드에 실패했습니다.';
      setDownloadError(errorMessage);
      console.error('CSV 다운로드 실패:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const tabs = [
    { key: 'summary', label: '현황 요약', icon: TrendingUp },
    { key: 'users', label: '회원 현황', icon: Users },
    { key: 'tickets', label: '티켓 현황', icon: Package },
    { key: 'points', label: '포인트 현황', icon: DollarSign },
    { key: 'boxes', label: '셔플박스', icon: Package },
    { key: 'draws', label: '뽑기 현황', icon: Activity },
    { key: 'pointmall', label: '포인트몰', icon: DollarSign },
    { key: 'timemissions', label: '타임미션', icon: Clock },
  ];

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
        <div>
          <h1 className="text-2xl font-bold">운영 현황</h1>
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            <p className="font-medium">오류 발생</p>
            <p className="mt-1 text-sm">{error}</p>
            <button 
              onClick={handleRefresh} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">운영 현황</h1>
        <p className="text-gray-500">리포트 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* 다운로드 진행 중 오버레이 */}
      {downloadLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CSV 파일 생성 중</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  데일리 리포트를 CSV 파일로 변환하고 있습니다.<br />
                  잠시만 기다려주세요...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 🆕 실시간 현황 요약 카드 */}
      {/*{realtimeData && (*/}
      {/*  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">*/}
      {/*    <div className="flex items-center justify-between mb-4">*/}
      {/*      <div className="flex items-center space-x-2">*/}
      {/*        <Zap size={24} />*/}
      {/*        <h2 className="text-xl font-bold">실시간 현황</h2>*/}
      {/*      </div>*/}
      {/*      <div className="flex items-center space-x-2 text-blue-100">*/}
      {/*        <Clock size={16} />*/}
      {/*        <span className="text-sm">*/}
      {/*          {new Date(realtimeData.lastUpdated).toLocaleTimeString('ko-KR')} 업데이트*/}
      {/*        </span>*/}
      {/*        {realtimeLoading && (*/}
      {/*          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>*/}
      {/*        )}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    */}
      {/*    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">*/}
      {/*      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">*/}
      {/*        <div className="flex items-center space-x-3">*/}
      {/*          <div className="p-2 bg-white/20 rounded-lg">*/}
      {/*            <UserCheck size={20} />*/}
      {/*          </div>*/}
      {/*          <div>*/}
      {/*            <p className="text-blue-100 text-sm">활성 사용자</p>*/}
      {/*            <p className="text-2xl font-bold">{formatNumber(realtimeData.activeUsers)}</p>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      */}
      {/*      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">*/}
      {/*        <div className="flex items-center space-x-3">*/}
      {/*          <div className="p-2 bg-white/20 rounded-lg">*/}
      {/*            <Users size={20} />*/}
      {/*          </div>*/}
      {/*          <div>*/}
      {/*            <p className="text-blue-100 text-sm">오늘 신규 가입</p>*/}
      {/*            <p className="text-2xl font-bold">{formatNumber(realtimeData.todayNewUsers)}</p>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      */}
      {/*      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">*/}
      {/*        <div className="flex items-center space-x-3">*/}
      {/*          <div className="p-2 bg-white/20 rounded-lg">*/}
      {/*            <Package size={20} />*/}
      {/*          </div>*/}
      {/*          <div>*/}
      {/*            <p className="text-blue-100 text-sm">오늘 티켓 발행</p>*/}
      {/*            <p className="text-2xl font-bold">{formatNumber(realtimeData.todayTicketsIssued)}</p>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      */}
      {/*      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">*/}
      {/*        <div className="flex items-center space-x-3">*/}
      {/*          <div className="p-2 bg-white/20 rounded-lg">*/}
      {/*            <DollarSign size={20} />*/}
      {/*          </div>*/}
      {/*          <div>*/}
      {/*            <p className="text-blue-100 text-sm">오늘 포인트 사용</p>*/}
      {/*            <p className="text-2xl font-bold">{formatNumber(realtimeData.todayPointsUsed)}</p>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 헤더 및 날짜 선택 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">운영 현황</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {reportData?.reportDate} 일일 보고서 ({reportData ? new Date(reportData.generatedAt).toLocaleString('ko-KR') : ''})
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* 날짜 선택 버튼들 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleDateChange('yesterday')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedDate === 'yesterday'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              어제
            </button>
            <button
              onClick={() => handleDateChange('today')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedDate === 'today'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => handleDateChange('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedDate === 'custom'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              날짜 선택
            </button>
          </div>
          
          {/* 커스텀 날짜 입력 */}
          {selectedDate === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleCustomDateSubmit}
                disabled={!customDate}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                조회
              </button>
            </div>
          )}
          
          {/* CSV 다운로드 버튼 */}
          <button
            onClick={handleDownloadCsv}
            disabled={!reportData || downloadLoading}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              downloadLoading 
                ? 'bg-blue-600 text-white cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {downloadLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>CSV 생성 중...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>CSV 다운로드</span>
              </>
            )}
          </button>
          
          {/* 새로고침 버튼 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 다운로드 에러 메시지 */}
      {downloadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                CSV 다운로드 오류
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {downloadError}
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleDownloadCsv}
                  disabled={downloadLoading}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100 bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => setDownloadError(null)}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* 요약 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="총 회원 수"
                value={reportData.summary.totalUsers}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Active 유저"
                value={reportData.summary.activeUsers}
                icon={UserCheck}
                color="green"
              />
              <StatCard
                title="미사용 포인트"
                value={reportData.summary.unusedPoints}
                icon={DollarSign}
                suffix="P"
                color="yellow"
              />
              <StatCard
                title="친구초대 유입"
                value={reportData.summary.inviteUsers}
                icon={Users}
                color="purple"
              />
            </div>

            {/* 티켓/포인트 현황 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="티켓 발행"
                value={reportData.summary.ticketEarned}
                icon={Package}
                suffix="장"
                color="blue"
              />
              <StatCard
                title="티켓 사용"
                value={reportData.summary.ticketUsed}
                icon={Package}
                suffix="장"
                color="green"
              />
              <StatCard
                title="티켓 만료"
                value={reportData.summary.ticketExpired}
                icon={Package}
                suffix="장"
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="포인트 발행"
                value={reportData.summary.pointEarned}
                icon={DollarSign}
                suffix="P"
                color="blue"
              />
              <StatCard
                title="포인트 사용"
                value={reportData.summary.pointUsed}
                icon={DollarSign}
                suffix="P"
                color="green"
              />
              <StatCard
                title="당일 소멸포인트"
                value={reportData.summary.pointExpiredToday}
                icon={DollarSign}
                suffix="P"
                color="yellow"
              />
              <StatCard
                title="총 소멸포인트"
                value={reportData.summary.totalPointExpired}
                icon={DollarSign}
                suffix="P"
                color="purple"
              />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users size={20} className="mr-2" />
              회원 현황
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">전날 총 회원</p>
                <p className="text-2xl font-bold">{formatNumber(reportData.userStats.prevTotalUsers)}명</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">신규가입</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(reportData.userStats.newUsers)}명</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">당일 탈퇴</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(reportData.userStats.withdrawnUsers)}명</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">가입 미완료</p>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(reportData.userStats.incompleteUsers)}명</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">당일 총 회원</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(reportData.userStats.totalUsers)}명</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* 티켓 발행 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                티켓 발행 현황
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">발행건수</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.ticketStats.issueCount)}건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">발행수량</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.ticketStats.issueTotal)}장</p>
                </div>
              </div>
              
              {/* 소스별 발행 현황 - 개선 */}
              {reportData.ticketStats.issueBySource && reportData.ticketStats.issueBySource.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">소스별 발행 현황 (일반/추가기회 구분)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2">소스</th>
                          <th className="text-left py-2">상세내용</th>
                          <th className="text-center py-2">유형</th>
                          <th className="text-right py-2">발행건수</th>
                          <th className="text-right py-2">발행수량</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.ticketStats.issueBySource.map((item: { 
                          sourceType: string; 
                          description: string; 
                          count: number; 
                          total: number; 
                          isExtraChance?: boolean;
                        }, index: number) => (
                          <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 ${
                            item.isExtraChance ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}>
                            <td className="py-2">{item.sourceType}</td>
                            <td className="py-2 flex items-center space-x-2">
                              <span>{item.description}</span>
                              {item.isExtraChance && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  광고
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {item.isExtraChance ? (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">추가기회</span>
                              ) : (
                                <span className="text-gray-600 dark:text-gray-400">일반</span>
                              )}
                            </td>
                            <td className="py-2 text-right">{formatNumber(item.count)}건</td>
                            <td className="py-2 text-right">{formatNumber(item.total)}장</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 티켓 사용 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">티켓 사용 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">브론즈 박스</p>
                  <p className="text-lg font-bold">
                    {formatNumber(reportData.ticketStats.bronzeUsageCount)}회 / {formatNumber(reportData.ticketStats.bronzeUsageTickets)}장
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">실버 박스</p>
                  <p className="text-lg font-bold">
                    {formatNumber(reportData.ticketStats.silverUsageCount)}회 / {formatNumber(reportData.ticketStats.silverUsageTickets)}장
                  </p>
                </div>
              </div>
            </div>

            {/* 🆕 게임별 추가참여 광고 현황 */}
            {reportData.adStats && reportData.adStats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <PlayCircle size={20} className="mr-2" />
                  게임별 추가참여 광고 현황
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3">게임명</th>
                        <th className="text-right py-3">광고 시청</th>
                        <th className="text-right py-3">추가 참여</th>
                        <th className="text-right py-3">지급 티켓</th>
                        <th className="text-right py-3">효율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.adStats.map((item: { 
                        actionName: string; 
                        watchCount: number; 
                        extraChanceGames: number; 
                        actualTickets: number; 
                      }, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 font-medium">{item.actionName}</td>
                          <td className="py-3 text-right">{formatNumber(item.watchCount)}회</td>
                          <td className="py-3 text-right">{formatNumber(item.extraChanceGames)}회</td>
                          <td className="py-3 text-right">{formatNumber(item.actualTickets)}장</td>
                          <td className="py-3 text-right">
                            <span className={`font-medium ${
                              item.watchCount === item.extraChanceGames ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {item.watchCount > 0 ? Math.round((item.extraChanceGames / item.watchCount) * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <p>* 효율: 광고 시청 대비 실제 게임 참여 비율</p>
                    <p>* 녹색: 100% 효율 (광고 시청 = 게임 참여), 주황색: 미달</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'points' && (
          <div className="space-y-6">
            {/* 포인트 발행 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign size={20} className="mr-2" />
                포인트 발행 현황
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">총 발행건수</p>
                  <p className="text-xl font-bold">{formatNumber(reportData.pointStats.issueCount)}건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">총 발행수량</p>
                  <p className="text-xl font-bold">{formatNumber(reportData.pointStats.issueTotal)}P</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">박스 포인트</p>
                  <p className="text-xl font-bold">{formatNumber(reportData.pointStats.boxPoints)}P</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">뽑기 포인트</p>
                  <p className="text-xl font-bold">{formatNumber(reportData.pointStats.drawPoints)}P</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">친구초대 포인트</p>
                  <p className="text-xl font-bold">{formatNumber(reportData.pointStats.invitePoints || 0)}P</p>
                </div>
              </div>
              
              {/* 🆕 친구초대 포인트 세부 내역 */}
              {((reportData.pointStats.inviteNormalCount || 0) > 0 || (reportData.pointStats.inviteBonusCount || 0) > 0) && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-md font-medium mb-3 text-blue-800 dark:text-blue-200">친구초대 포인트 상세</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(reportData.pointStats.inviteNormalCount || 0) > 0 && (
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                          일반 친구초대 ({reportData.pointStats.inviteNormalCount || 0}명)
                        </p>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {formatNumber(reportData.pointStats.inviteNormalPoints || 0)}P
                        </p>
                      </div>
                    )}
                    {(reportData.pointStats.inviteBonusCount || 0) > 0 && (
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                          5명 달성 보너스 ({reportData.pointStats.inviteBonusCount || 0}명)
                        </p>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {formatNumber(reportData.pointStats.inviteBonusPoints || 0)}P
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 포인트 사용 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">포인트 사용 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">뽑기</p>
                  <p className="text-lg font-bold">
                    {formatNumber(reportData.pointStats.drawUsageCount)}회 / {formatNumber(reportData.pointStats.drawUsagePoints)}P
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">포인트몰</p>
                  <p className="text-lg font-bold">
                    {formatNumber(reportData.pointStats.mallUsageCount)}회 / {formatNumber(reportData.pointStats.mallUsagePoints)}P
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'boxes' && (
          <div className="space-y-6">
            {/* 브론즈 박스 당첨 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                브론즈 박스 당첨 현황
              </h2>
              {reportData.boxStats?.bronzeWinnings && reportData.boxStats.bronzeWinnings.length > 0 ? (
                <div className="space-y-3">
                  {reportData.boxStats.bronzeWinnings.map((item: { type: string; count: number; points: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium">{item.type}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">{formatNumber(item.count)}회</span>
                        <span className="text-sm text-gray-500 ml-2">{formatNumber(item.points)}P</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">당첨 데이터가 없습니다.</p>
              )}
            </div>

            {/* 실버 박스 당첨 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">실버 박스 당첨 현황</h2>
              {reportData.boxStats?.silverWinnings && reportData.boxStats.silverWinnings.length > 0 ? (
                <div className="space-y-3">
                  {reportData.boxStats.silverWinnings.map((item: { type: string; count: number; points: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium">{item.type}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">{formatNumber(item.count)}회</span>
                        <span className="text-sm text-gray-500 ml-2">{formatNumber(item.points)}P</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">당첨 데이터가 없습니다.</p>
              )}
            </div>

            {/* 웰컴 박스 당첨 현황 */}
            {reportData.boxStats?.welcomeWinnings && reportData.boxStats.welcomeWinnings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🎁</span>
                  웰컴 박스 당첨 현황
                </h2>
                <div className="space-y-3">
                  {reportData.boxStats.welcomeWinnings.map((item: { type: string; count: number; points: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded">
                      <span className="font-medium">{item.type}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatNumber(item.count)}회</span>
                        <span className="text-sm text-green-500 dark:text-green-300 ml-2">{formatNumber(item.points)}P</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 셔플박스 당첨 상세 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                셔플박스 당첨 상세 현황
              </h2>
              {reportData.boxStats?.detailedWinnings && reportData.boxStats.detailedWinnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">박스유형</th>
                        <th className="text-left py-2">상품명</th>
                        <th className="text-right py-2">당첨횟수</th>
                        <th className="text-right py-2">포인트</th>
                        <th className="text-right py-2">설정확률</th>
                        <th className="text-right py-2">실제확률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.boxStats.detailedWinnings.map((item: { 
                        boxType: string; 
                        prizeName: string; 
                        count: number; 
                        points: number; 
                        setProbability: number; 
                        actualProbability: number; 
                      }, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2">{item.boxType}</td>
                          <td className="py-2">{item.prizeName}</td>
                          <td className="py-2 text-right">{formatNumber(item.count)}회</td>
                          <td className="py-2 text-right">{formatNumber(item.points)}P</td>
                          <td className="py-2 text-right">{item.setProbability.toFixed(4)}%</td>
                          <td className="py-2 text-right">{item.actualProbability.toFixed(4)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">상세 당첨 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'draws' && (
          <div className="space-y-6">
            {/* 뽑기별 참여 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Activity size={20} className="mr-2" />
                뽑기별 참여 현황
              </h2>
              {reportData.drawStats?.participation && reportData.drawStats.participation.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">뽑기명</th>
                        <th className="text-right py-2">참여횟수</th>
                        <th className="text-right py-2">사용포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.drawStats.participation.map((item: { drawName: string; count: number; points: number }, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2">{item.drawName}</td>
                          <td className="py-2 text-right">{formatNumber(item.count)}회</td>
                          <td className="py-2 text-right">{formatNumber(item.points)}P</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">참여 데이터가 없습니다.</p>
              )}
            </div>

            {/* 뽑기별 당첨 현황 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">뽑기별 당첨 현황</h2>
              {reportData.drawStats?.winnings && reportData.drawStats.winnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">뽑기유형</th>
                        <th className="text-left py-2">상품명</th>
                        <th className="text-right py-2">당첨횟수</th>
                        <th className="text-right py-2">포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.drawStats.winnings.map((item: { drawType: string; prizeName: string; count: number; points: number }, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2">{item.drawType}</td>
                          <td className="py-2">{item.prizeName}</td>
                          <td className="py-2 text-right">{formatNumber(item.count)}회</td>
                          <td className="py-2 text-right">{formatNumber(item.points)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">당첨 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pointmall' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign size={20} className="mr-2" />
              포인트몰 이용 현황
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">기프티콘</p>
                <p className="text-lg font-bold">
                  {formatNumber(reportData.pointMallStats?.gifticonCount || 0)}건 / {formatNumber(reportData.pointMallStats?.gifticonPoints || 0)}P
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">현물</p>
                <p className="text-lg font-bold">
                  {formatNumber(reportData.pointMallStats?.physicalCount || 0)}건 / {formatNumber(reportData.pointMallStats?.physicalPoints || 0)}P
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timemissions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock size={20} className="mr-2" />
              타임미션 액션별 현황
            </h2>
            {reportData.timeMissionStats?.hasData && reportData.timeMissionStats?.data && reportData.timeMissionStats.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 font-medium">미션명</th>
                      <th className="py-3 font-medium">액션명</th>
                      <th className="py-3 text-right font-medium">참여자수</th>
                      <th className="py-3 text-right font-medium">참여횟수</th>
                      <th className="py-3 text-right font-medium">획득티켓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.timeMissionStats.data.map((mission, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 font-medium">{mission.missionName}</td>
                        <td className="py-2">{mission.selectedActions}</td>
                        <td className="py-2 text-right">{formatNumber(mission.participantCount)}명</td>
                        <td className="py-2 text-right">{formatNumber(mission.participationCount)}회</td>
                        <td className="py-2 text-right">{formatNumber(mission.ticketsEarned)}장</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">타임미션 데이터가 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
