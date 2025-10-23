import { useEffect, useState } from 'react';
import { isReadOnlyMode, canPerformWriteOperations, getReadOnlyModeMessage } from '@/lib/utils/env';

/**
 * 읽기 전용 모드 상태를 관리하는 Hook
 */
export const useReadOnlyMode = () => {
  const [readOnlyMode, setReadOnlyMode] = useState<boolean>(true); // 기본값은 읽기 전용으로 안전하게 설정
  const [canWrite, setCanWrite] = useState<boolean>(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const isReadOnly = isReadOnlyMode();
      const canPerformWrite = canPerformWriteOperations();
      
      setReadOnlyMode(isReadOnly);
      setCanWrite(canPerformWrite);
      
      console.log('🔒 Read-only mode status:', {
        readOnlyMode: isReadOnly,
        canWrite: canPerformWrite
      });
    }
  }, []);

  return {
    isReadOnlyMode: readOnlyMode,
    canPerformWriteOperations: canWrite,
    readOnlyMessage: getReadOnlyModeMessage()
  };
};

/**
 * 읽기 전용 모드에서 작업을 차단하는 Hook
 */
export const useBlockWriteOperations = () => {
  const { isReadOnlyMode, readOnlyMessage } = useReadOnlyMode();

  const blockIfReadOnly = (operation: () => void, customMessage?: string) => {
    if (isReadOnlyMode) {
      alert(customMessage || readOnlyMessage);
      return;
    }
    operation();
  };

  const confirmIfReadOnly = (operation: () => void, confirmMessage: string = "정말 실행하시겠습니까?") => {
    if (isReadOnlyMode) {
      alert(readOnlyMessage);
      return;
    }
    
    if (confirm(confirmMessage)) {
      operation();
    }
  };

  return {
    blockIfReadOnly,
    confirmIfReadOnly,
    isReadOnlyMode
  };
};
