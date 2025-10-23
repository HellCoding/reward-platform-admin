import React from 'react';
import { useBlockWriteOperations } from '@/hooks/useReadOnlyMode';
import { ConditionalWriteButton } from '@/components/ui/read-only-mode';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Plus } from 'lucide-react';

/**
 * 읽기 전용 모드를 적용한 컴포넌트 예시
 */
export const ExampleAdminComponent: React.FC = () => {
  const { blockIfReadOnly, confirmIfReadOnly, isReadOnlyMode } = useBlockWriteOperations();

  const handleCreate = () => {
    console.log('새 항목 생성');
    // 실제 생성 로직
  };

  const handleEdit = (id: number) => {
    console.log(`항목 ${id} 수정`);
    // 실제 수정 로직
  };

  const handleDelete = (id: number) => {
    console.log(`항목 ${id} 삭제`);
    // 실제 삭제 로직
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">관리 항목 목록</h2>
        
        {/* 방법 1: ConditionalWriteButton 사용 */}
        <ConditionalWriteButton>
          <Button 
            onClick={() => blockIfReadOnly(handleCreate)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            새 항목 추가
          </Button>
        </ConditionalWriteButton>
      </div>

      <div className="grid gap-4">
        {/* 샘플 데이터 */}
        {[1, 2, 3].map((item) => (
          <div key={item} className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-medium">항목 {item}</h3>
              <p className="text-sm text-gray-600">항목 설명...</p>
            </div>
            
            <div className="flex gap-2">
              {/* 방법 2: 조건부 렌더링 */}
              {!isReadOnlyMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => blockIfReadOnly(() => handleEdit(item))}
                  >
                    <Edit size={14} />
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmIfReadOnly(
                      () => handleDelete(item),
                      `정말로 항목 ${item}을(를) 삭제하시겠습니까?`
                    )}
                  >
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
              
              {/* 읽기 전용일 때 표시할 대체 버튼 */}
              {isReadOnlyMode && (
                <Button variant="outline" size="sm" disabled>
                  조회만 가능
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
