"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Upload, Coins, Package, Ticket, Gift, Search, CheckCircle, AlertCircle } from "lucide-react";
import { prizeService } from "@/services/randomBoxService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

// 기본 상품 이미지들
const DEFAULT_PRIZE_IMAGE = "/images/default-prize.png";
const DEFAULT_POINT_IMAGE = "/images/img-point.png";  // 🆕 포인트 상품 기본 이미지
const DEFAULT_GIFTICON_IMAGE = "/images/default-prize.png"; // 🆕 기프티콘 기본 이미지
const DEFAULT_PHYSICAL_IMAGE = "/images/default-prize.png"; // 🆕 실물 상품 기본 이미지

// 🆕 상품 타입별 기본 이미지 반환 함수
const getDefaultImageByType = (prizeType: string): string => {
  switch (prizeType) {
    case 'POINT':
      return DEFAULT_POINT_IMAGE;
    case 'GIFTICON':
      return DEFAULT_GIFTICON_IMAGE;
    case 'PHYSICAL':
    case 'POINT_MALL_PHYSICAL':
      return DEFAULT_PHYSICAL_IMAGE;
    default:
      return DEFAULT_PRIZE_IMAGE;
  }
};

// 상품 타입별 아이콘 매핑
const getPrizeTypeIcon = (prizeType: string): React.JSX.Element => {
  switch (prizeType?.toUpperCase()) {
    case 'POINT': return <Coins className="w-6 h-6 text-yellow-500" />;
    case 'GIFTICON': return <Ticket className="w-6 h-6 text-green-500" />;
    case 'PHYSICAL': return <Package className="w-6 h-6 text-blue-500" />;
    default: return <Gift className="w-6 h-6 text-purple-500" />;
  }
};

interface CreateForm {
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  description: string;
  isActive: boolean;
  imageUrl: string;
  // 🆕 실물 상품 추가 필드들
  basePrice?: number;      // 원가/정가
  shippingFee?: number;    // 배송비
  deliveryMethod?: string; // 배송 방법
  estimatedDeliveryDays?: number; // 예상 배송일
  // 🆕 실물 상품 이미지 관리
  detailImageUrls?: string[]; // 디테일 이미지 URL 목록
}

interface PlatformGift {
  code: string;
  title: string;
  content: string;
  imgUrl: string;
  affiliate: string;
  category1: string;
  category2: string;
  pillyPrice: number;
  saleState: boolean | null;
  realPrice: number | null;
  listPrice: number | null;
}

interface Draw {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  isActive: boolean;
}

interface GifticonSettings {
  platformCode: string;
  displayStatus: boolean;
  displayStartDate?: string;
  displayEndDate?: string;
  reviewRequired: boolean;
  provider: 'KT' | 'CJ' | 'PARTNER_PIN';
  availableStart?: string;
  availableEnd?: string;
  drawId?: number;
  winningPeriodDays: number;
  totalWinningCount: number;
  winningProbability: number;
  displayProbability?: string;
  winningStartDate?: string;
  socialProofEnabled: boolean;
  pushEnabled: boolean;
}

export default function NewPrizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: "",
    brand: "",
    prizeType: "POINT",  // 🔄 type → prizeType 변경
    value: 0,
    description: "",
    isActive: true,
    imageUrl: DEFAULT_POINT_IMAGE, // 🔄 초기값을 포인트 기본 이미지로 설정
    // 🆕 실물 상품 필드 초기값
    basePrice: 0,
    shippingFee: 0,
    deliveryMethod: "STANDARD",
    estimatedDeliveryDays: 3,
    detailImageUrls: [] // 🆕 디테일 이미지 초기값
  });

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [valueInput, setValueInput] = useState<string>('0');
  const [winningProbabilityInput, setWinningProbabilityInput] = useState<string>('0.1');
  const [totalWinningCountInput, setTotalWinningCountInput] = useState<string>('1');
  // 🆕 실물 상품 숫자 입력 필드들
  const [basePriceInput, setBasePriceInput] = useState<string>('0');
  const [shippingFeeInput, setShippingFeeInput] = useState<string>('0');
  const [deliveryDaysInput, setDeliveryDaysInput] = useState<string>('3');

  // 기프티콘 관련 상태
  const [showPlatformSearch, setShowPlatformSearch] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [platformGifts, setPlatformGifts] = useState<PlatformGift[]>([]);
  const [availableDraws, setAvailableDraws] = useState<Draw[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedPlatformGift, setSelectedPlatformGift] = useState<PlatformGift | null>(null);

  const [gifticonSettings, setGifticonSettings] = useState<GifticonSettings>({
    platformCode: '',
    displayStatus: false,
    reviewRequired: false,
    provider: 'PARTNER_PIN',
    winningPeriodDays: 30,
    totalWinningCount: 1,
    winningProbability: 0.1,
    socialProofEnabled: false,
    pushEnabled: false,
  });

  const pageSize = 20;

  useEffect(() => {
    if (form.prizeType === 'GIFTICON') {  // 🔄 type → prizeType 변경
      loadAvailableDraws();
    }
  }, [form.prizeType]);

  // 🔄 수정: 상품 타입 변경시 기본 이미지 자동 변경
  useEffect(() => {
    const defaultImage = getDefaultImageByType(form.prizeType);
    // 현재 이미지가 다른 타입의 기본 이미지이거나 비어있으면 새 기본 이미지로 변경
    const isCurrentImageDefault = [
      DEFAULT_POINT_IMAGE,
      DEFAULT_GIFTICON_IMAGE, 
      DEFAULT_PHYSICAL_IMAGE,
      DEFAULT_PRIZE_IMAGE,
      ""
    ].includes(form.imageUrl);
    
    if (isCurrentImageDefault) {
      setForm(prev => ({ ...prev, imageUrl: defaultImage }));
    }
  }, [form.prizeType]);

  // URL 파라미터 확인 useEffect
  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'GIFTICON') {
      setForm(prev => ({ ...prev, prizeType: 'GIFTICON' }));  // 🔄 type → prizeType 변경
      // Platform 검색 창을 자동으로 열기
      setTimeout(() => {
        setShowPlatformSearch(true);
      }, 500);
    }
  }, [searchParams]);

  const loadAvailableDraws = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/gifticons/available-draws`);
      if (response.ok) {
        const draws = await response.json();
        setAvailableDraws(draws);
      }
    } catch (error) {
      console.error('Failed to load available draws:', error);
    }
  };

  const openSearchModal = async () => {
    setShowPlatformSearch(true);
    
    // 검색어가 있으면 자동으로 검색 실행
    if (searchTitle.trim()) {
      // 약간의 딜레이를 두어 모달이 완전히 열린 후 검색 실행
      setTimeout(() => {
        searchPlatformGifts();
      }, 100);
    }
  };

  const searchPlatformGifts = async () => {
    setSearchLoading(true);
    setAlert(null); // 기존 알림 제거
    
    try {
      const params = new URLSearchParams({
        fetchSize: pageSize.toString(),
        fetchStart: (currentPage * pageSize).toString(),
      });
      
      if (searchTitle.trim()) {
        params.append('title', searchTitle.trim());
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/gifticons/platform/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setPlatformGifts(data.gifts || []);
        setTotalCount(data.totalCount || 0);
        
        // 검색 결과가 없을 때 사용자에게 알림
        if (data.totalCount === 0) {
          if (searchTitle.trim()) {
            setAlert({ 
              type: 'error', 
              message: `'${searchTitle}' 검색 결과가 없습니다. 다른 키워드로 검색해보세요.` 
            });
          } else {
            setAlert({ 
              type: 'error', 
              message: '검색 결과가 없습니다. 검색 키워드를 입력해보세요.' 
            });
          }
        } else {
          setAlert({ 
            type: 'success', 
            message: `${data.totalCount}개의 기프티콘을 찾았습니다.` 
          });
        }
      } else {
        throw new Error('Failed to search platform gifts');
      }
    } catch (error) {
      console.error('Search error:', error);
      setAlert({ type: 'error', message: '플랫폼 기프티콘 검색 중 오류가 발생했습니다.' });
      setPlatformGifts([]);
      setTotalCount(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const checkGifticonExists = async (platformCode: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/admin/gifticons/exists/${platformCode}`);
      return response.ok ? await response.json() : false;
    } catch (error) {
      console.error('Failed to check gifticon existence:', error);
      return false;
    }
  };

  const selectPlatformGift = async (gift: PlatformGift) => {
    const exists = await checkGifticonExists(gift.code);
    if (exists) {
      setAlert({ type: 'error', message: '이미 SHUFFLEX에 등록된 기프티콘입니다.' });
      return;
    }

    setSelectedPlatformGift(gift);
    // Platform 기프티콘 정보를 폼에 자동 입력
    // 가격 우선순위: realPrice > listPrice > pillyPrice
    const price = gift.realPrice || gift.listPrice || gift.pillyPrice || 0;
    setForm(prev => ({
      ...prev,
      name: gift.title,
      brand: gift.affiliate,
      prizeType: 'GIFTICON',  // 🔄 type → prizeType 변경
      value: price,
      description: gift.content || '',
      imageUrl: gift.imgUrl || getDefaultImageByType('GIFTICON') // 🔄 기프티콘 기본 이미지 사용
    }));
    
    setGifticonSettings(prev => ({
      ...prev,
      platformCode: gift.code
    }));
    
    setShowPlatformSearch(false);
    setAlert({ type: 'success', message: 'Platform 기프티콘 정보가 자동으로 입력되었습니다!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      window.alert("상품명을 입력해주세요.");
      return;
    }
    
    if (!form.brand.trim()) {
      window.alert("브랜드를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      if (form.prizeType === 'GIFTICON' && gifticonSettings.platformCode) {  // 🔄 type → prizeType 변경
        // 기프티콘 통합 등록 (4개 테이블 동시)
        const gifticonData = {
          ...gifticonSettings,
          name: form.name,
          brand: form.brand,
          value: form.value,
          description: form.description,
          isActive: form.isActive,
          imageUrl: form.imageUrl
        };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${apiUrl}/admin/gifticons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gifticonData),
        });

        if (response.ok) {
          const result = await response.json();
          window.alert("기프티콘이 성공적으로 등록되었습니다!");
          router.push(`/prizes/${result.prizeId}`);
        } else {
          const error = await response.json();
          throw new Error(error.message || '등록에 실패했습니다.');
        }
      } else {
        // 일반 상품 등록
        const createData = {
          name: form.name,
          brand: form.brand,
          prizeType: form.prizeType,  // 🔄 type → prizeType 변경
          value: form.value,
          description: form.description,
          isActive: form.isActive,
          imageUrl: form.imageUrl,
          // 🆕 디테일 이미지 (실물 상품인 경우에만, 빈 URL 제외)
          detailImageUrls: isPhysicalProduct(form.prizeType) 
            ? (form.detailImageUrls?.filter(url => url.trim() !== '') || [])
            : undefined,
          // 🆕 실물 상품 추가 필드들
          ...(isPhysicalProduct(form.prizeType) && {
            basePrice: form.basePrice,
            shippingFee: form.shippingFee,
            deliveryMethod: form.deliveryMethod,
            estimatedDeliveryDays: form.estimatedDeliveryDays
          })
        };

        const response = await prizeService.createPrize(createData);
        window.alert("상품이 등록되었습니다.");
        router.push(`/prizes/${response.id}`);
      }
    } catch (error) {
      console.error("상품 등록 실패:", error);
      window.alert(error instanceof Error ? error.message : "상품 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("작성 중인 내용이 모두 사라집니다. 정말로 취소하시겠습니까?")) {
      router.push("/prizes");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // 🆕 실물 상품 여부 확인 헬퍼 함수
  const isPhysicalProduct = (prizeType: string) => {
    return prizeType === 'PHYSICAL' || prizeType === 'POINT_MALL_PHYSICAL';
  };

  // 🆕 디테일 이미지 관리 함수들
  const addDetailImage = () => {
    setForm(prev => ({
      ...prev,
      detailImageUrls: [...(prev.detailImageUrls || []), ""]
    }));
  };

  const updateDetailImage = (index: number, url: string) => {
    setForm(prev => ({
      ...prev,
      detailImageUrls: prev.detailImageUrls?.map((item, i) => i === index ? url : item) || []
    }));
  };

  const removeDetailImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      detailImageUrls: prev.detailImageUrls?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/prizes")}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            새 상품 등록
          </h1>
        </div>
      </div>

      {/* 알림 */}
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          {alert.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* 상품 등록 폼 */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {form.prizeType === 'GIFTICON' ? (  // 🔄 type → prizeType 변경
              // 기프티콘 등록 인터페이스 (탭 제거)
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 왼쪽: 이미지 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">상품 이미지</h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt="상품 미리보기"
                          className="w-full max-w-xs mx-auto rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_PRIZE_IMAGE) {
                              target.src = DEFAULT_PRIZE_IMAGE;
                            }
                          }}
                        />
                      ) : (
                        <div className="text-gray-400">
                          <Upload className="w-12 h-12 mx-auto mb-2" />
                          <p>이미지 URL을 입력하세요</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="이미지 URL 입력"
                          value={form.imageUrl}
                          onChange={(e) => setForm({...form, imageUrl: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 상세 정보 */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">상품 정보</h3>
                    
                    {/* 상품 타입 (계속 선택 가능) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        상품 타입 <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'POINT', label: '포인트', description: '리워드 플랫폼 포인트 상품' },
                          { value: 'GIFTICON', label: '기프티콘', description: '모바일 기프티콘 상품 (Platform 연동)' },
                          { value: 'PHYSICAL', label: '실물', description: '배송이 필요한 실물 상품' }
                        ].map((type) => (
                          <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="prizeType"  
                              value={type.value}
                              checked={form.prizeType === type.value}  // 🔄 type → prizeType 변경
                              onChange={(e) => setForm({...form, prizeType: e.target.value})}  // 🔄 type → prizeType 변경
                              className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex items-center space-x-2">
                              {getPrizeTypeIcon(type.value)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 기프티콘 검색 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        기프티콘 검색
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="기프티콘 제목으로 검색..."
                          value={searchTitle}
                          onChange={(e) => setSearchTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault(); // form submit 방지
                              openSearchModal();
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={openSearchModal}
                          disabled={searchLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                      {selectedPlatformGift && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={selectedPlatformGift.imgUrl || DEFAULT_PRIZE_IMAGE}
                              alt={selectedPlatformGift.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-green-800 dark:text-green-200">{selectedPlatformGift.title}</p>
                              <p className="text-sm text-green-600 dark:text-green-300">{selectedPlatformGift.affiliate}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlatformGift(null);
                                setForm({...form, name: '', brand: '', value: 0, description: '', imageUrl: ''});
                                setGifticonSettings(prev => ({...prev, platformCode: ''}));
                              }}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 상품명 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        상품명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="상품명을 입력하세요"
                      />
                    </div>

                    {/* 브랜드 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        브랜드 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.brand}
                        onChange={(e) => setForm({...form, brand: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="브랜드명을 입력하세요"
                      />
                    </div>

                    {/* 가치 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        가치
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={valueInput}
                          onChange={(e) => setValueInput(e.target.value)}
                          onFocus={(e) => {
                            // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                            if (e.target.value === '0') {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            const numValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                            setForm({...form, value: numValue});
                            setValueInput(numValue.toString());
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          placeholder="0"
                          min={0}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 dark:text-gray-400">원</span>
                        </div>
                      </div>
                    </div>

                    {/* 설명 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        설명
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="상품에 대한 상세 설명을 입력하세요"
                      />
                    </div>

                    {/* 상태 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        상태
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: true, label: '활성', description: '즉시 사용 가능한 상품' },
                          { value: false, label: '비활성', description: '사용 불가능한 상품' }
                        ].map((status) => (
                          <label key={status.value.toString()} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="isActive"
                              value={status.value.toString()}
                              checked={form.isActive === status.value}
                              onChange={(e) => setForm({...form, isActive: e.target.value === 'true'})}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{status.label}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{status.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 기프티콘 고급 설정 (접을 수 있도록) */}
                    {selectedPlatformGift && (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기프티콘 고급 설정</h4>
                        
                        {/* 기프티콘 설정 */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">전시 상태</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={gifticonSettings.displayStatus}
                                onChange={(e) => setGifticonSettings(prev => ({ ...prev, displayStatus: e.target.checked }))}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {gifticonSettings.displayStatus ? '전시함' : '전시안함'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">후기 작성 필수</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={gifticonSettings.reviewRequired}
                                onChange={(e) => setGifticonSettings(prev => ({ ...prev, reviewRequired: e.target.checked }))}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {gifticonSettings.reviewRequired ? '필수' : '선택'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 뽑기 매핑 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">뽑기 선택 (선택사항)</label>
                            <select
                              value={gifticonSettings.drawId?.toString() || ''}
                              onChange={(e) => setGifticonSettings(prev => ({ ...prev, drawId: e.target.value ? parseInt(e.target.value) : undefined }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            >
                              <option value="">뽑기를 선택하세요 (선택사항)</option>
                              {availableDraws.map((draw) => (
                                <option key={draw.id} value={draw.id.toString()}>
                                  {draw.name} ({draw.pointCost}P)
                                </option>
                              ))}
                            </select>
                          </div>

                          {gifticonSettings.drawId && (
                            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">당첨 확률 (0-1)</label>
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  max="1"
                                  value={winningProbabilityInput}
                                  onChange={(e) => setWinningProbabilityInput(e.target.value)}
                                  onFocus={(e) => {
                                    // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                                    if (e.target.value === '0.1' || e.target.value === '0') {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const numValue = e.target.value === '' ? 0.1 : parseFloat(e.target.value) || 0.1;
                                    setGifticonSettings(prev => ({ ...prev, winningProbability: numValue }));
                                    setWinningProbabilityInput(numValue.toString());
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">총 당첨 수량</label>
                                <input
                                  type="number"
                                  value={totalWinningCountInput}
                                  onChange={(e) => setTotalWinningCountInput(e.target.value)}
                                  onFocus={(e) => {
                                    // focus 시 값이 기본값이면 전체 선택하여 입력 편의성 향상
                                    if (e.target.value === '1' || e.target.value === '0') {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const numValue = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                                    setGifticonSettings(prev => ({ ...prev, totalWinningCount: numValue }));
                                    setTotalWinningCountInput(numValue.toString());
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  min={1}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // 일반 상품 등록 폼 (기존 코드)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 왼쪽: 이미지 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isPhysicalProduct(form.prizeType) ? '상품 이미지 관리' : '상품 이미지'}
                  </h3>
                  
                  {/* 썸네일 이미지 (모든 상품 공통) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isPhysicalProduct(form.prizeType) ? '썸네일 이미지 (대표 이미지)' : '상품 이미지'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt="썸네일 미리보기"
                          className="w-full max-w-xs mx-auto rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== getDefaultImageByType(form.prizeType)) {
                              target.src = getDefaultImageByType(form.prizeType);
                            }
                          }}
                        />
                      ) : (
                        <div className="text-gray-400">
                          <Upload className="w-12 h-12 mx-auto mb-2" />
                          <p>썸네일 이미지 URL을 입력하세요</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder={`${form.prizeType === 'POINT' ? '포인트' : form.prizeType === 'GIFTICON' ? '기프티콘' : '실물'} 상품 기본 이미지가 자동 설정됩니다`}
                          value={form.imageUrl}
                          onChange={(e) => setForm({...form, imageUrl: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 🆕 디테일 이미지 (실물 상품만) */}
                  {isPhysicalProduct(form.prizeType) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          상세 이미지 (선택사항)
                        </label>
                        <button
                          type="button"
                          onClick={addDetailImage}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          + 이미지 추가
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {form.detailImageUrls?.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder={`상세 이미지 ${index + 1} URL`}
                                value={url}
                                onChange={(e) => updateDetailImage(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            {url && (
                              <div className="w-12 h-12 border rounded overflow-hidden">
                                <img
                                  src={url}
                                  alt={`상세 이미지 ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeDetailImage(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        
                        {(!form.detailImageUrls || form.detailImageUrls.length === 0) && (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            상세 이미지가 없습니다. 위의 &ldquo;+ 이미지 추가&rdquo; 버튼을 클릭하여 추가하세요.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 상세 정보 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">상품 정보</h3>
                  
                  {/* 상품명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상품명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="상품명을 입력하세요"
                    />
                  </div>

                  {/* 브랜드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      브랜드 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.brand}
                      onChange={(e) => setForm({...form, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="브랜드명을 입력하세요"
                    />
                  </div>

                  {/* 상품 타입 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상품 타입 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'POINT', label: '포인트', description: '리워드 플랫폼 포인트 상품' },
                        { value: 'GIFTICON', label: '기프티콘', description: '모바일 기프티콘 상품 (Platform 연동)' },
                        { value: 'PHYSICAL', label: '실물', description: '배송이 필요한 실물 상품' }
                      ].map((type) => (
                        <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            type="radio"
                            name="prizeType"  
                            value={type.value}
                            checked={form.prizeType === type.value}  // 🔄 type → prizeType 변경
                            onChange={(e) => setForm({...form, prizeType: e.target.value})}  // 🔄 type → prizeType 변경
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex items-center space-x-2">
                            {getPrizeTypeIcon(type.value)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 가치 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      가치
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        onFocus={(e) => {
                          // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        onBlur={(e) => {
                          const numValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                          setForm({...form, value: numValue});
                          setValueInput(numValue.toString());
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="0"
                        min={0}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 dark:text-gray-400">
                          {form.prizeType === 'POINT' ? 'P' : '원'}  {/* 🔄 type → prizeType 변경 */}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {form.value === 0 ? '0 입력 시 가변 포인트로 설정됩니다' : '고정 값으로 설정됩니다'}
                    </p>
                  </div>

                  {/* 설명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      설명
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      placeholder="상품에 대한 상세 설명을 입력하세요"
                    />
                  </div>

                  {/* 🆕 실물 상품 추가 입력란 */}
                  {isPhysicalProduct(form.prizeType) && (
                    <div className="border-t pt-6 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">실물 상품 상세 정보</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* 원가/정가 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            원가/정가
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={basePriceInput}
                              onChange={(e) => setBasePriceInput(e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                const numValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                setForm({...form, basePrice: numValue});
                                setBasePriceInput(numValue.toString());
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                              placeholder="0"
                              min={0}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 dark:text-gray-400">원</span>
                            </div>
                          </div>
                        </div>

                        {/* 배송비 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            배송비
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={shippingFeeInput}
                              onChange={(e) => setShippingFeeInput(e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                const numValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                                setForm({...form, shippingFee: numValue});
                                setShippingFeeInput(numValue.toString());
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                              placeholder="0"
                              min={0}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 dark:text-gray-400">원</span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            0원 입력시 무료배송
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* 배송 방법 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            배송 방법
                          </label>
                          <select
                            value={form.deliveryMethod || 'STANDARD'}
                            onChange={(e) => setForm({...form, deliveryMethod: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          >
                            <option value="STANDARD">일반 배송</option>
                            <option value="EXPRESS">빠른 배송</option>
                            <option value="SAME_DAY">당일 배송</option>
                            <option value="PICKUP">직접 수령</option>
                          </select>
                        </div>

                        {/* 예상 배송일 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            예상 배송일
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={deliveryDaysInput}
                              onChange={(e) => setDeliveryDaysInput(e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === '3') {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                const numValue = e.target.value === '' ? 3 : Number(e.target.value) || 3;
                                setForm({...form, estimatedDeliveryDays: numValue});
                                setDeliveryDaysInput(numValue.toString());
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                              placeholder="3"
                              min={1}
                              max={30}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 dark:text-gray-400">일</span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            주문 후 예상 배송 소요일
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상태
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: true, label: '활성', description: '즉시 사용 가능한 상품' },
                        { value: false, label: '비활성', description: '사용 불가능한 상품' }
                      ].map((status) => (
                        <label key={status.value.toString()} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            type="radio"
                            name="isActive"
                            value={status.value.toString()}
                            checked={form.isActive === status.value}
                            onChange={(e) => setForm({...form, isActive: e.target.value === 'true'})}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{status.label}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{status.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {loading ? '등록 중...' : (form.prizeType === 'GIFTICON' && gifticonSettings.platformCode ? '기프티콘 통합 등록' : '상품 등록')}  {/* 🔄 type → prizeType 변경 */}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Platform 검색 다이얼로그 */}
      <Dialog open={showPlatformSearch} onOpenChange={setShowPlatformSearch}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>기프티콘 검색</span>
            </DialogTitle>
            <DialogDescription>
              기프티콘을 검색하고 선택하면 자동으로 상품 정보가 입력됩니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 검색 */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="기프티콘 제목으로 검색..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      searchPlatformGifts();
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              <Button onClick={searchPlatformGifts} disabled={searchLoading}>
                {searchLoading ? '검색 중...' : '검색'}
              </Button>
            </div>

            {/* 검색 가이드 */}
            {!searchLoading && platformGifts.length === 0 && totalCount === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">기프티콘을 검색해보세요</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    위의 검색창에 기프티콘 이름이나 브랜드명을 입력하면<br />
                    Platform API에서 기프티콘을 찾아드립니다.
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-md mx-auto">
                  <div className="font-medium mb-1">💡 검색 팁</div>
                  <div className="space-y-1 text-left">
                    <div>• &ldquo;스타벅스&rdquo;, &ldquo;아메리카노&rdquo; 등 브랜드명이나 상품명으로 검색</div>
                    <div>• &ldquo;습기&rdquo;, &ldquo;소분통&rdquo; 등 키워드로 검색</div>
                    <div>• &ldquo;BBQ&rdquo;, &ldquo;치킨&rdquo; 등 음식 관련 키워드로 검색</div>
                  </div>
                </div>
              </div>
            )}

            {/* 검색 결과 */}
            {platformGifts.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  총 {totalCount}개의 기프티콘이 검색되었습니다.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {platformGifts.map((gift, index) => {
                    // saleState가 null이 아니고 true이면 판매중, 아니면 판매중단으로 표시
                    // Platform API에서 null이 많이 나오므로 기본적으로 판매중으로 표시
                    const isAvailable = gift.saleState !== false;
                    // 가격 우선순위: realPrice > listPrice > pillyPrice
                    const displayPrice = gift.realPrice || gift.listPrice || gift.pillyPrice || 0;
                    
                    return (
                      <Card key={`${gift.code}-${index}`} className="border hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectPlatformGift(gift)}>
                        <CardContent className="p-4">
                          <div className="flex space-x-3">
                            <img
                              src={gift.imgUrl || DEFAULT_PRIZE_IMAGE}
                              alt={gift.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== DEFAULT_PRIZE_IMAGE) {
                                  target.src = DEFAULT_PRIZE_IMAGE;
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate" title={gift.title}>
                                {gift.title}
                              </h3>
                              <p className="text-xs text-gray-600 truncate" title={gift.affiliate}>
                                {gift.affiliate}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold text-blue-600">
                                  {displayPrice === 0 ? '가격정보없음' : formatPrice(displayPrice)}
                                </span>
                                <Badge variant={isAvailable ? "default" : "secondary"}>
                                  {isAvailable ? '판매중' : '판매중단'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      이전
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}