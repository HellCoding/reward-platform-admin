'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Activity, 
  Settings, 
  BarChart3,
  Users,
  TrendingUp,
  Ticket,
  MonitorPlay,
  Plus,
  Trash2
} from 'lucide-react';
import { actionService, AdminActionDTO, AdminActionStatisticsDTO, AdminActionUpdateRequest, AdminActionAdConfigDTO, AdminActionAdConfigUpdateRequest, AdminActionAdStatisticsDTO } from '@/services/actionService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function ActionManagePage() {
  const params = useParams();
  const router = useRouter();
  const actionId = parseInt(params.actionId as string);

  const [action, setAction] = useState<AdminActionDTO | null>(null);
  const [statistics, setStatistics] = useState<AdminActionStatisticsDTO | null>(null);
  const [adConfig, setAdConfig] = useState<AdminActionAdConfigDTO | null>(null);
  const [adStatistics, setAdStatistics] = useState<AdminActionAdStatisticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState<AdminActionUpdateRequest>({});
  const [adFormData, setAdFormData] = useState<AdminActionAdConfigUpdateRequest>({});

  // 숫자 입력 필드용 로컬 상태 (입력 중 빈 문자열 허용)
  const [localInputs, setLocalInputs] = useState({
    successReward: '',
    failReward: '',
    dailyLimit: '',
    maxDailyReward: '',
    additionalChances: '',
    adDailyLimit: '',
    priority: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [actionData, statisticsData] = await Promise.all([
        actionService.getAction(actionId),
        actionService.getActionDetailStatistics(actionId, 30)
      ]);
      
      setAction(actionData);
      setStatistics(statisticsData);
      
      // 폼 데이터 초기화
      setFormData({
        actionName: actionData.actionName,
        description: actionData.description,
        successReward: actionData.successReward,
        failReward: actionData.failReward,
        dailyLimit: actionData.dailyLimit,
        maxDailyReward: actionData.maxDailyReward,
        isActive: actionData.isActive,
      });

      // 로컬 입력 상태 초기화
      setLocalInputs({
        successReward: String(actionData.successReward || ''),
        failReward: String(actionData.failReward || ''),
        dailyLimit: String(actionData.dailyLimit || ''),
        maxDailyReward: String(actionData.maxDailyReward || ''),
        additionalChances: String(actionData.adConfig?.additionalChances || ''),
        adDailyLimit: String(actionData.adConfig?.dailyLimit || ''),
        priority: String(actionData.adConfig?.priority || '')
      });

      // 광고 관련 데이터 로딩 (있는 경우)
      if (actionData.adConfig) {
        setAdConfig(actionData.adConfig);
        setAdFormData({
          configName: actionData.adConfig.configName,
          additionalChances: actionData.adConfig.additionalChances,
          dailyLimit: actionData.adConfig.dailyLimit,
          isActive: actionData.adConfig.isActive,
          androidAdUnitId: actionData.adConfig.androidAdUnitId,
          iosAdUnitId: actionData.adConfig.iosAdUnitId,
          priority: actionData.adConfig.priority,
        });
      }

      if (actionData.adStatistics) {
        setAdStatistics(actionData.adStatistics);
      }

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load action:', err);
    } finally {
      setLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    if (actionId) {
      loadData();
    }
  }, [actionId, loadData]);

  const handleSave = async () => {
    if (!action) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedAction = await actionService.updateAction(actionId, formData);
      setAction(updatedAction);
      
      // 성공 알림
      alert('액션 설정이 성공적으로 저장되었습니다.');
    } catch (err) {
      setError('설정 저장에 실패했습니다.');
      console.error('Failed to save action:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminActionUpdateRequest, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdInputChange = (field: keyof AdminActionAdConfigUpdateRequest, value: string | number | boolean) => {
    setAdFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAdConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const newAdConfig = await actionService.createActionAdConfig(actionId, {
        configName: `${action?.actionName} Extra Chance Ad`,
        additionalChances: 1,
        dailyLimit: 2,
        isActive: true,
        androidAdUnitId: '',
        iosAdUnitId: '',
        priority: 0,
        ...adFormData
      });
      
      setAdConfig(newAdConfig);
      alert('광고 설정이 성공적으로 생성되었습니다.');
    } catch (err) {
      setError('광고 설정 생성에 실패했습니다.');
      console.error('Failed to create ad config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdConfig = async () => {
    if (!adConfig) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedAdConfig = await actionService.updateActionAdConfig(actionId, adFormData);
      setAdConfig(updatedAdConfig);
      
      alert('광고 설정이 성공적으로 저장되었습니다.');
    } catch (err) {
      setError('광고 설정 저장에 실패했습니다.');
      console.error('Failed to save ad config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdConfig = async () => {
    if (!adConfig || !confirm('광고 설정을 삭제하시겠습니까?')) return;

    try {
      setSaving(true);
      setError(null);
      
      await actionService.deleteActionAdConfig(actionId);
      setAdConfig(null);
      setAdFormData({});
      
      alert('광고 설정이 성공적으로 삭제되었습니다.');
    } catch (err) {
      setError('광고 설정 삭제에 실패했습니다.');
      console.error('Failed to delete ad config:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !action) {
    return <ErrorAlert message={error} onRetry={loadData} />;
  }

  if (!action) {
    return <ErrorAlert message="액션을 찾을 수 없습니다." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8" />
            {action.actionName} 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            {action.actionTypeKorean} 액션의 상세 설정을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                기본 정보 저장
              </>
            )}
          </Button>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>

      {error && (
        <ErrorAlert message={error} onRetry={() => setError(null)} />
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            기본 설정
          </TabsTrigger>
          <TabsTrigger value="ads">
            <MonitorPlay className="w-4 h-4 mr-2" />
            광고 설정
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            통계 분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="actionName">액션 이름</Label>
                  <Input
                    id="actionName"
                    value={formData.actionName || ''}
                    onChange={(e) => handleInputChange('actionName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">활성화</Label>
                  <Badge variant={formData.isActive ? "default" : "secondary"}>
                    {formData.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 보상 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  보상 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="successReward">성공 시 보상</Label>
                    <Input
                      id="successReward"
                      type="number"
                      value={localInputs.successReward}
                      onChange={(e) => {
                        setLocalInputs(prev => ({ ...prev, successReward: e.target.value }));
                      }}
                      onFocus={(e) => {
                        // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        // blur 시 빈 값이면 0으로 설정, 실제 formData 업데이트
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange('successReward', value);
                        setLocalInputs(prev => ({ ...prev, successReward: String(value) }));
                      }}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">티켓 장수</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="failReward">실패 시 보상</Label>
                    <Input
                      id="failReward"
                      type="number"
                      value={localInputs.failReward}
                      onChange={(e) => {
                        setLocalInputs(prev => ({ ...prev, failReward: e.target.value }));
                      }}
                      onFocus={(e) => {
                        // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        // blur 시 빈 값이면 0으로 설정, 실제 formData 업데이트
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange('failReward', value);
                        setLocalInputs(prev => ({ ...prev, failReward: String(value) }));
                      }}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">티켓 장수</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">일일 참여 제한</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={localInputs.dailyLimit}
                      onChange={(e) => {
                        setLocalInputs(prev => ({ ...prev, dailyLimit: e.target.value }));
                      }}
                      onFocus={(e) => {
                        // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        // blur 시 빈 값이면 0으로 설정, 실제 formData 업데이트
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange('dailyLimit', value);
                        setLocalInputs(prev => ({ ...prev, dailyLimit: String(value) }));
                      }}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">참여 횟수</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyReward">일일 최대 보상</Label>
                    <Input
                      id="maxDailyReward"
                      type="number"
                      value={localInputs.maxDailyReward}
                      onChange={(e) => {
                        setLocalInputs(prev => ({ ...prev, maxDailyReward: e.target.value }));
                      }}
                      onFocus={(e) => {
                        // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        // blur 시 빈 값이면 0으로 설정, 실제 formData 업데이트
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleInputChange('maxDailyReward', value);
                        setLocalInputs(prev => ({ ...prev, maxDailyReward: String(value) }));
                      }}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">티켓 장수</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 현재 설정 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>설정 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">상태:</span>
                  <Badge className="ml-2" variant={formData.isActive ? "default" : "secondary"}>
                    {formData.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">성공 보상:</span>
                  <span className="ml-2 font-medium">{formData.successReward}장</span>
                </div>
                <div>
                  <span className="text-muted-foreground">일일 제한:</span>
                  <span className="ml-2 font-medium">{formData.dailyLimit}회</span>
                </div>
                <div>
                  <span className="text-muted-foreground">최대 보상:</span>
                  <span className="ml-2 font-medium">{formData.maxDailyReward}장</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          {!adConfig ? (
            /* 광고 설정 없는 경우 */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5" />
                  광고 추가 기회 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    이 액션에는 광고 추가 기회 설정이 없습니다.
                  </div>
                  <Button onClick={handleCreateAdConfig} disabled={saving}>
                    <Plus className="w-4 h-4 mr-2" />
                    광고 설정 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* 광고 설정 있는 경우 */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">광고 추가 기회 설정</h2>
                <div className="flex gap-2">
                  <Button onClick={handleSaveAdConfig} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button onClick={handleDeleteAdConfig} variant="destructive" disabled={saving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 기본 광고 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle>기본 설정</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adConfigName">설정 이름</Label>
                      <Input
                        id="adConfigName"
                        value={adFormData.configName || ''}
                        onChange={(e) => handleAdInputChange('configName', e.target.value)}
                        placeholder="광고 설정 이름"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="additionalChances">광고당 추가 기회</Label>
                        <Input
                          id="additionalChances"
                          type="number"
                          value={localInputs.additionalChances}
                          onChange={(e) => {
                            setLocalInputs(prev => ({ ...prev, additionalChances: e.target.value }));
                          }}
                          onFocus={(e) => {
                            // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                            if (e.target.value === '1' || e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            // blur 시 빈 값이면 기본값 1로 설정, 실제 adFormData 업데이트
                            const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                            handleAdInputChange('additionalChances', value);
                            setLocalInputs(prev => ({ ...prev, additionalChances: String(value) }));
                          }}
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-muted-foreground">1회 광고 시청당 획득할 추가 기회 수</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="adDailyLimit">일일 광고 제한</Label>
                        <Input
                          id="adDailyLimit"
                          type="number"
                          value={localInputs.adDailyLimit}
                          onChange={(e) => {
                            setLocalInputs(prev => ({ ...prev, adDailyLimit: e.target.value }));
                          }}
                          onFocus={(e) => {
                            // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                            if (e.target.value === '2' || e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            // blur 시 빈 값이면 기본값 2로 설정, 실제 adFormData 업데이트
                            const value = e.target.value === '' ? 2 : parseInt(e.target.value) || 2;
                            handleAdInputChange('dailyLimit', value);
                            setLocalInputs(prev => ({ ...prev, adDailyLimit: String(value) }));
                          }}
                          min="1"
                          max="20"
                        />
                        <p className="text-xs text-muted-foreground">하루 최대 광고 시청 횟수</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="adIsActive"
                        checked={adFormData.isActive || false}
                        onCheckedChange={(checked) => handleAdInputChange('isActive', checked)}
                      />
                      <Label htmlFor="adIsActive">광고 활성화</Label>
                      <Badge variant={adFormData.isActive ? "default" : "secondary"}>
                        {adFormData.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 플랫폼별 광고 ID */}
                <Card>
                  <CardHeader>
                    <CardTitle>플랫폼별 광고 ID</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="androidAdUnitId">Android 광고 단위 ID</Label>
                      <Input
                        id="androidAdUnitId"
                        value={adFormData.androidAdUnitId || ''}
                        onChange={(e) => handleAdInputChange('androidAdUnitId', e.target.value)}
                        placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx"
                      />
                      <p className="text-xs text-muted-foreground">AdMob Android 광고 단위 ID</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iosAdUnitId">iOS 광고 단위 ID</Label>
                      <Input
                        id="iosAdUnitId"
                        value={adFormData.iosAdUnitId || ''}
                        onChange={(e) => handleAdInputChange('iosAdUnitId', e.target.value)}
                        placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx"
                      />
                      <p className="text-xs text-muted-foreground">AdMob iOS 광고 단위 ID</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">우선순위</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={localInputs.priority}
                        onChange={(e) => {
                          setLocalInputs(prev => ({ ...prev, priority: e.target.value }));
                        }}
                        onFocus={(e) => {
                          // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        onBlur={(e) => {
                          // blur 시 빈 값이면 0으로 설정, 실제 adFormData 업데이트
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          handleAdInputChange('priority', value);
                          setLocalInputs(prev => ({ ...prev, priority: String(value) }));
                        }}
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground">높을수록 우선 선택됨</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 광고 통계 */}
              {adStatistics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      광고 성과 분석 (최근 7일)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{adStatistics.weeklyAdWatches}</div>
                        <div className="text-sm text-muted-foreground">총 광고 시청 (7일)</div>
                        <div className="text-xs text-gray-500">오늘: {adStatistics.todayAdWatches}회</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{adStatistics.weeklyExtraChancesUsed}</div>
                        <div className="text-sm text-muted-foreground">총 추가 기회 사용 (7일)</div>
                        <div className="text-xs text-gray-500">오늘: {adStatistics.todayExtraChancesUsed}회</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{adStatistics.adConversionRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">전환율 (7일 기준)</div>
                        <div className="text-xs text-gray-500">평균 일일: {adStatistics.averageDailyAdWatches.toFixed(1)}회</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          {statistics && (
            <>
              {/* 통계 요약 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      총 참여 횟수
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.participationCount}회</div>
                    <p className="text-xs text-muted-foreground">최근 30일</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      참여 사용자
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.uniqueUsers}명</div>
                    <p className="text-xs text-muted-foreground">고유 사용자</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-purple-500" />
                      티켓 발행
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalTicketsEarned}장</div>
                    <p className="text-xs text-muted-foreground">총 발행량</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      평균 참여율
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.averageParticipationRate.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">회/사용자</p>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    상세 분석 (최근 30일)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">참여 현황</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">총 참여 횟수:</span>
                          <span className="font-medium">{statistics.participationCount}회</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">참여 사용자 수:</span>
                          <span className="font-medium">{statistics.uniqueUsers}명</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">사용자당 평균 참여:</span>
                          <span className="font-medium">{statistics.averageParticipationRate.toFixed(2)}회</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">보상 현황</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">총 티켓 발행:</span>
                          <span className="font-medium">{statistics.totalTicketsEarned}장</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">사용자당 평균 티켓:</span>
                          <span className="font-medium">{statistics.averageTicketsPerUser.toFixed(2)}장</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">참여당 평균 티켓:</span>
                          <span className="font-medium">
                            {(statistics.totalTicketsEarned / statistics.participationCount).toFixed(2)}장
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
