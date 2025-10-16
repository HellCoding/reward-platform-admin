'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { coupangPartnersService } from '@/services/api';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  Clock, 
  Calendar,
  Star,
  ExternalLink,
  Settings
} from 'lucide-react';

interface CoupangPartnersConfig {
  id?: number;
  configName: string;
  linkUrl: string;
  startTime?: string;
  endTime?: string;
  activeDays: string;
  isActive: boolean;
  priority: number;
  message: string;
}

export default function CoupangPartnersPage() {
  const [configs, setConfigs] = useState<CoupangPartnersConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<CoupangPartnersConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CoupangPartnersConfig | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<Omit<CoupangPartnersConfig, 'id'>>({
    configName: '',
    linkUrl: '',
    startTime: '',
    endTime: '',
    activeDays: 'ALL',
    isActive: true,
    priority: 1,
    message: ''
  });

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [priorityInput, setPriorityInput] = useState<string>('1');
  const [editPriorityInput, setEditPriorityInput] = useState<string>('1');

  // 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsData, currentData] = await Promise.all([
        coupangPartnersService.getAllConfigs(),
        coupangPartnersService.getCurrentConfig().catch(() => null)
      ]);
      
      setConfigs(configsData || []);
      setCurrentConfig(currentData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch coupang partners data:', err);
      setError('쿠팡 파트너스 설정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 설정 생성
  const handleCreate = async () => {
    try {
      await coupangPartnersService.createConfig(formData);
      setIsCreateModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      console.error('Failed to create config:', err);
      setError('설정 생성 중 오류가 발생했습니다.');
    }
  };

  // 설정 수정
  const handleEdit = async () => {
    if (!editingConfig?.id) return;
    
    try {
      await coupangPartnersService.updateConfig(editingConfig.id, editingConfig);
      setIsEditModalOpen(false);
      setEditingConfig(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to update config:', err);
      setError('설정 수정 중 오류가 발생했습니다.');
    }
  };

  // 설정 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 설정을 삭제하시겠습니까?')) return;
    
    try {
      await coupangPartnersService.deleteConfig(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete config:', err);
      setError('설정 삭제 중 오류가 발생했습니다.');
    }
  };

  // 활성화/비활성화 토글
  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await coupangPartnersService.toggleConfig(id, !isActive);
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle config:', err);
      setError('설정 변경 중 오류가 발생했습니다.');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      configName: '',
      linkUrl: '',
      startTime: '',
      endTime: '',
      activeDays: 'ALL',
      isActive: true,
      priority: 1,
      message: ''
    });
  };

  // 편집 시작
  const startEdit = (config: CoupangPartnersConfig) => {
    setEditingConfig({ ...config });
    setEditPriorityInput(config.priority.toString());
    setIsEditModalOpen(true);
  };

  // 요일 표시 변환
  const formatActiveDays = (activeDays: string) => {
    if (activeDays === 'ALL') return '매일';
    const days = activeDays.split(',');
    const dayNames: Record<string, string> = {
      'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 
      'FRI': '금', 'SAT': '토', 'SUN': '일'
    };
    return days.map(day => dayNames[day] || day).join(', ');
  };

  // 시간 범위 표시
  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '24시간';
    if (!startTime) return `~${endTime}`;
    if (!endTime) return `${startTime}~`;
    return `${startTime}~${endTime}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-500" />
            쿠팡 파트너스 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            시간별/조건별 쿠팡 파트너스 링크 및 메시지를 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                새 설정 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 쿠팡 파트너스 설정 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">설정 이름</label>
                  <Input
                    value={formData.configName}
                    onChange={(e) => setFormData({...formData, configName: e.target.value})}
                    placeholder="예: 저녁 타임세일"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">쿠팡 링크</label>
                  <Input
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                    placeholder="https://link.coupang.com/a/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">시작 시간</label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">종료 시간</label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">활성 요일</label>
                    <Select value={formData.activeDays} onValueChange={(value) => setFormData({...formData, activeDays: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">매일</SelectItem>
                        <SelectItem value="MON,TUE,WED,THU,FRI">평일</SelectItem>
                        <SelectItem value="SAT,SUN">주말</SelectItem>
                        <SelectItem value="MON,TUE,WED">월화수</SelectItem>
                        <SelectItem value="THU,FRI,SAT">목금토</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">우선순위</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={priorityInput}
                      onChange={(e) => setPriorityInput(e.target.value)}
                      onFocus={(e) => {
                        // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                        if (e.target.value === '1' || e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        const numValue = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                        setFormData({...formData, priority: numValue});
                        setPriorityInput(numValue.toString());
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">사용자 메시지</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="쿠팡에서 특가상품을 구경하고 티켓도 받아요!"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">즉시 활성화</label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreate}>
                    생성
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* 현재 활성 설정 */}
      {currentConfig && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <Star className="w-5 h-5" />
              현재 활성 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">설정 이름</p>
                <p className="font-medium">{currentConfig.configName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">활성 시간</p>
                <p className="font-medium">{formatTimeRange(currentConfig.startTime, currentConfig.endTime)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">활성 요일</p>
                <p className="font-medium">{formatActiveDays(currentConfig.activeDays)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">우선순위</p>
                <p className="font-medium">{currentConfig.priority}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">사용자 메시지</p>
              <p className="font-medium">{currentConfig.message}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">링크</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{currentConfig.linkUrl}</p>
                <Button size="sm" variant="outline" onClick={() => window.open(currentConfig.linkUrl, '_blank')}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 설정 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 설정 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>설정 이름</TableHead>
                <TableHead>시간 범위</TableHead>
                <TableHead>활성 요일</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>링크</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {config.configName}
                    {currentConfig?.id === config.id && (
                      <Badge variant="default" className="ml-2">현재 활성</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeRange(config.startTime, config.endTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatActiveDays(config.activeDays)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{config.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(config.linkUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(config)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => config.id && handleToggle(config.id, config.isActive)}
                      >
                        <Power className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => config.id && handleDelete(config.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {configs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">설정이 없습니다. 새 설정을 추가해보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 편집 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>쿠팡 파트너스 설정 수정</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">설정 이름</label>
                <Input
                  value={editingConfig.configName}
                  onChange={(e) => setEditingConfig({...editingConfig, configName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">쿠팡 링크</label>
                <Input
                  value={editingConfig.linkUrl}
                  onChange={(e) => setEditingConfig({...editingConfig, linkUrl: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">시작 시간</label>
                  <Input
                    type="time"
                    value={editingConfig.startTime || ''}
                    onChange={(e) => setEditingConfig({...editingConfig, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">종료 시간</label>
                  <Input
                    type="time"
                    value={editingConfig.endTime || ''}
                    onChange={(e) => setEditingConfig({...editingConfig, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">활성 요일</label>
                  <Select value={editingConfig.activeDays} onValueChange={(value) => setEditingConfig({...editingConfig, activeDays: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">매일</SelectItem>
                      <SelectItem value="MON,TUE,WED,THU,FRI">평일</SelectItem>
                      <SelectItem value="SAT,SUN">주말</SelectItem>
                      <SelectItem value="MON,TUE,WED">월화수</SelectItem>
                      <SelectItem value="THU,FRI,SAT">목금토</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">우선순위</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={editPriorityInput}
                    onChange={(e) => setEditPriorityInput(e.target.value)}
                    onFocus={(e) => {
                      // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                      if (e.target.value === '1' || e.target.value === '0') {
                        e.target.select();
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                      setEditingConfig({...editingConfig, priority: numValue});
                      setEditPriorityInput(numValue.toString());
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">사용자 메시지</label>
                <Textarea
                  value={editingConfig.message}
                  onChange={(e) => setEditingConfig({...editingConfig, message: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingConfig.isActive}
                  onChange={(e) => setEditingConfig({...editingConfig, isActive: e.target.checked})}
                />
                <label htmlFor="editIsActive" className="text-sm font-medium">활성화</label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleEdit}>
                  수정
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}