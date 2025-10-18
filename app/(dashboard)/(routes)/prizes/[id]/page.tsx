"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Save, X, Coins, Package, Ticket, Gift, Plus, Minus, Image as ImageIcon } from "lucide-react";
import { prizeService } from "@/services/randomBoxService";

// 기본 상품 이미지 (웹 프로젝트에서 복사해온 실제 파일)
const DEFAULT_PRIZE_IMAGE = "/images/default-prize.png";

// 상품 타입별 아이콘 매핑
const getPrizeTypeIcon = (prizeType: string): React.JSX.Element => {
  switch (prizeType?.toUpperCase()) {
    case 'POINT': return <Coins className="w-6 h-6 text-yellow-500" />;
    case 'GIFTICON': return <Ticket className="w-6 h-6 text-green-500" />;
    case 'PHYSICAL': return <Package className="w-6 h-6 text-blue-500" />;
    case 'POINT_MALL_PHYSICAL': return <Package className="w-6 h-6 text-blue-600" />;
    case 'POINT_MALL_GIFTCARD': return <Gift className="w-6 h-6 text-purple-500" />;
    case 'POINT_MALL_GIFTICON': return <Ticket className="w-6 h-6 text-green-600" />;
    default: return <Gift className="w-6 h-6 text-purple-500" />;
  }
};

const getPrizeTypeLabel = (prizeType: string): string => {
  switch (prizeType?.toUpperCase()) {
    case 'POINT': return '포인트';
    case 'GIFTICON': return '기프티콘';
    case 'PHYSICAL': return '실물';
    case 'POINT_MALL_PHYSICAL': return '포인트몰 실물상품';
    case 'POINT_MALL_GIFTCARD': return '포인트몰 상품권';
    case 'POINT_MALL_GIFTICON': return '포인트몰 기프티콘';
    default: return prizeType || '기타';
  }
};

// 실물 상품 타입인지 확인하는 함수
const isPhysicalProduct = (prizeType: string): boolean => {
  return ['PHYSICAL', 'POINT_MALL_PHYSICAL'].includes(prizeType?.toUpperCase());
};

interface Prize {
  id: number;
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  imageUrl: string;
  detailImageUrls?: string[];  // 🆕 디테일 이미지 배열
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditForm {
  name: string;
  brand: string;
  prizeType: string;  // 🔄 type → prizeType 변경
  value: number;
  description: string;
  isActive: boolean;
  imageUrl: string;
  detailImageUrls: string[];  // 🆕 디테일 이미지 배열
}

export default function PrizeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prize, setPrize] = useState<Prize | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);  // 🆕 선택된 이미지 인덱스
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    brand: "",
    prizeType: "",  // 🔄 type → prizeType 변경
    value: 0,
    description: "",
    isActive: true,
    imageUrl: "",
    detailImageUrls: []  // 🆕 디테일 이미지 배열
  });

  // 숫자 입력 필드의 로컬 상태 (빈 문자열 허용)
  const [valueInput, setValueInput] = useState<string>('');

  const prizeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const fetchPrize = useCallback(async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출 시도
      try {
        const data = await prizeService.getPrizeById(Number(prizeId));
        
        // 백엔드 응답을 프론트엔드 형식으로 변환
        const mappedPrize: Prize = {
          id: data.prizeId,
          name: data.name,
          brand: data.brand,
          prizeType: data.prizeType,  // 🔄 type → prizeType 변경
          value: data.value,
          imageUrl: data.thumbnailUrl || DEFAULT_PRIZE_IMAGE,
          detailImageUrls: data.detailImageUrls || [],  // 🆕 디테일 이미지 배열
          description: data.description,
          isActive: data.isActive !== undefined ? data.isActive : data.displayStatus !== undefined ? data.displayStatus : true,
          createdAt: data.displayStartDate || new Date().toISOString(),
          updatedAt: data.displayEndDate || new Date().toISOString()
        };
        
        setPrize(mappedPrize);
        
        // 편집 폼 초기화
        setEditForm({
          name: mappedPrize.name,
          brand: mappedPrize.brand,
          prizeType: mappedPrize.prizeType,  // 🔄 type → prizeType 변경
          value: mappedPrize.value,
          description: mappedPrize.description || "",
          isActive: mappedPrize.isActive,
          imageUrl: mappedPrize.imageUrl,
          detailImageUrls: mappedPrize.detailImageUrls || []  // 🆕 디테일 이미지 배열
        });
        setValueInput(mappedPrize.value.toString());
        
      } catch (apiError) {
        console.error("API 호출 실패, 목 데이터 사용:", apiError);
        
        // API 실패 시 목 데이터 생성
        const mockPrize: Prize = {
          id: Number(prizeId),
          name: "스타벅스 아메리카노",
          brand: "STARBUCKS",
          prizeType: "POINT_MALL_PHYSICAL",  // 🔄 type → prizeType 변경
          value: 4500,
          imageUrl: "/images/starbucks-americano.png",
          detailImageUrls: [  // 🆕 샘플 디테일 이미지
            "/images/starbucks-detail-1.png",
            "/images/starbucks-detail-2.png"
          ],
          description: "스타벅스 아메리카노 기프티콘입니다. 전국 스타벅스 매장에서 사용 가능합니다.",
          isActive: true,
          createdAt: "2024-01-01T00:00:00",
          updatedAt: "2024-01-01T00:00:00"
        };
        
        setPrize(mockPrize);
        
        setEditForm({
          name: mockPrize.name,
          brand: mockPrize.brand,
          prizeType: mockPrize.prizeType,  // 🔄 type → prizeType 변경
          value: mockPrize.value,
          description: mockPrize.description || "",
          isActive: mockPrize.isActive,
          imageUrl: mockPrize.imageUrl,
          detailImageUrls: mockPrize.detailImageUrls || []  // 🆕 디테일 이미지 배열
        });
        setValueInput(mockPrize.value.toString());
      }
    } catch (error) {
      console.error("상품 상세 조회 실패:", error);
      alert("상품 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [prizeId]);

  useEffect(() => {
    if (prizeId) {
      fetchPrize();
    }
  }, [prizeId, fetchPrize]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (prize) {
      setEditForm({
        name: prize.name,
        brand: prize.brand,
        prizeType: prize.prizeType,  // 🔄 type → prizeType 변경
        value: prize.value,
        description: prize.description || "",
        isActive: prize.isActive,
        imageUrl: prize.imageUrl,
        detailImageUrls: prize.detailImageUrls || []  // 🆕 디테일 이미지 배열
      });
      setValueInput(prize.value.toString());
    }
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      const updateData = {
        name: editForm.name,
        brand: editForm.brand,
        prizeType: editForm.prizeType,  // 🔄 type → prizeType 변경
        value: editForm.value,
        description: editForm.description,
        isActive: editForm.isActive,
        imageUrl: editForm.imageUrl,
        detailImageUrls: editForm.detailImageUrls.filter(url => url && url.trim() !== "")  // 🆕 디테일 이미지 전송 (빈 값 제외)
      };

      await prizeService.updatePrize(Number(prizeId), updateData);
      
      // 수정 후 데이터 다시 가져오기
      await fetchPrize();
      setEditing(false);
      alert("상품이 수정되었습니다.");
    } catch (error) {
      console.error("상품 수정 실패:", error);
      alert("상품 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;

    try {
      await prizeService.deletePrize(Number(prizeId));
      alert("상품이 삭제되었습니다.");
      router.push("/prizes");
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      alert("상품 삭제에 실패했습니다.");
    }
  };

  const toggleStatus = async () => {
    if (!prize) return;

    try {
      await prizeService.togglePrizeStatus(prize.id, !prize.isActive);
      await fetchPrize();
    } catch (error) {
      console.error("상품 상태 변경 실패:", error);
      alert("상품 상태 변경에 실패했습니다.");
    }
  };

  // 🆕 디테일 이미지 추가
  const addDetailImage = () => {
    setEditForm({
      ...editForm,
      detailImageUrls: [...editForm.detailImageUrls, ""]
    });
  };

  // 🆕 디테일 이미지 제거
  const removeDetailImage = (index: number) => {
    const newDetailImages = editForm.detailImageUrls.filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      detailImageUrls: newDetailImages
    });
  };

  // 🆕 디테일 이미지 URL 변경
  const updateDetailImageUrl = (index: number, url: string) => {
    const newDetailImages = [...editForm.detailImageUrls];
    newDetailImages[index] = url;
    setEditForm({
      ...editForm,
      detailImageUrls: newDetailImages
    });
  };

  // 🆕 모든 이미지 배열 (썸네일 + 디테일)
  const getAllImages = () => {
    if (!prize) return [];
    const images = [prize.imageUrl];
    if (prize.detailImageUrls && prize.detailImageUrls.length > 0) {
      images.push(...prize.detailImageUrls);
    }
    return images.filter(img => img && img.trim() !== "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prize) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          상품을 찾을 수 없습니다
        </h2>
        <button
          onClick={() => router.push("/prizes")}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          상품 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const allImages = getAllImages();

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
            상품 상세
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {!editing ? (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                수정
              </button>
              <button
                onClick={toggleStatus}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  prize.isActive
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {prize.isActive ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                {prize.isActive ? '비활성화' : '활성화'}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                삭제
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={16} className="mr-2" />
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X size={16} className="mr-2" />
                취소
              </button>
            </>
          )}
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 이미지 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">상품 이미지</h3>
              
              {/* 🆕 메인 이미지 표시 */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[selectedImageIndex] || DEFAULT_PRIZE_IMAGE}
                      alt={`${prize.name} 이미지 ${selectedImageIndex + 1}`}
                      className="w-full max-w-md mx-auto rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== DEFAULT_PRIZE_IMAGE) {
                          target.src = DEFAULT_PRIZE_IMAGE;
                        }
                      }}
                    />
                    
                    {/* 🆕 이미지 네비게이션 */}
                    {allImages.length > 1 && (
                      <div className="mt-4 flex justify-center space-x-2">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              selectedImageIndex === index
                                ? 'bg-blue-600'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* 🆕 이미지 타입 표시 */}
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {selectedImageIndex === 0 ? '썸네일 이미지' : `디테일 이미지 ${selectedImageIndex}`}
                      {/* 🔄 type → prizeType 변경 */}
                      {isPhysicalProduct(prize.prizeType) && selectedImageIndex > 0 && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">(실물상품)</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>이미지가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 🆕 이미지 썸네일 목록 */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {allImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? 'border-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={imageUrl || DEFAULT_PRIZE_IMAGE}
                        alt={`썸네일 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== DEFAULT_PRIZE_IMAGE) {
                            target.src = DEFAULT_PRIZE_IMAGE;
                          }
                        }}
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {index === 0 ? '썸네일' : `상세${index}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 🆕 편집 모드에서 이미지 관리 */}
              {editing && (
                <div className="space-y-4">
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">이미지 관리</h4>
                    
                    {/* 썸네일 이미지 편집 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        썸네일 이미지 URL
                      </label>
                      <input
                        type="text"
                        placeholder="썸네일 이미지 URL 입력"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* 🆕 실물상품일 때만 디테일 이미지 관리 표시 (🔄 type → prizeType 변경) */}
                    {isPhysicalProduct(editForm.prizeType) && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            디테일 이미지 URL
                          </label>
                          <button
                            type="button"
                            onClick={addDetailImage}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus size={14} className="mr-1" />
                            추가
                          </button>
                        </div>
                        
                        {editForm.detailImageUrls.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder={`디테일 이미지 ${index + 1} URL 입력`}
                              value={url}
                              onChange={(e) => updateDetailImageUrl(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeDetailImage(index)}
                              className="flex items-center px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                          </div>
                        ))}
                        
                        {editForm.detailImageUrls.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            실물상품에 디테일 이미지를 추가하여 상품을 더 자세히 보여주세요.
                          </p>
                        )}
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
                  상품명
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-semibold">{prize.name}</p>
                )}
              </div>

              {/* 브랜드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  브랜드
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{prize.brand}</p>
                )}
              </div>

              {/* 상품 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상품 타입
                </label>
                {editing ? (
                  <select
                    value={editForm.prizeType}
                    onChange={(e) => setEditForm({...editForm, prizeType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="POINT">포인트</option>
                    <option value="GIFTICON">기프티콘</option>
                    <option value="PHYSICAL">실물</option>
                    <option value="POINT_MALL_PHYSICAL">포인트몰 실물상품</option>
                    <option value="POINT_MALL_GIFTCARD">포인트몰 상품권</option>
                    <option value="POINT_MALL_GIFTICON">포인트몰 기프티콘</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    {getPrizeTypeIcon(prize.prizeType)}
                    <span className="text-gray-900 dark:text-white">{getPrizeTypeLabel(prize.prizeType)}</span>
                    {isPhysicalProduct(prize.prizeType) && (
                      <span className="ml-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        실물상품
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 가치 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  가치
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={valueInput}
                    onChange={(e) => {
                      setValueInput(e.target.value);
                    }}
                    onFocus={(e) => {
                      // focus 시 값이 0이면 전체 선택하여 입력 편의성 향상
                      if (e.target.value === '0') {
                        e.target.select();
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                      setEditForm({...editForm, value: numValue});
                      setValueInput(numValue.toString());
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min={0}
                  />
                ) : (
                  <div>
                    {prize.value === 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        가변 (DB 설정)
                      </span>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {prize.prizeType === 'POINT' ? `${prize.value}P` : `${prize.value.toLocaleString()}원`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                {editing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{prize.description || "설명이 없습니다."}</p>
                )}
              </div>

              {/* 🆕 이미지 정보 요약 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이미지 정보
                </label>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <ImageIcon size={16} className="text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      총 {allImages.length}개
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    (썸네일 1개{prize.detailImageUrls && prize.detailImageUrls.length > 0 ? `, 디테일 ${prize.detailImageUrls.length}개` : ''})
                  </div>
                  {isPhysicalProduct(prize.prizeType) && (
                    <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded">
                      실물상품용 이미지
                    </span>
                  )}
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                {editing ? (
                  <select
                    value={editForm.isActive.toString()}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prize.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {prize.isActive ? '활성' : '비활성'}
                  </span>
                )}
              </div>

              {/* 등록/수정일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    등록일
                  </label>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {new Date(prize.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    수정일
                  </label>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {new Date(prize.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}