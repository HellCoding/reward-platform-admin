import React from 'react';
import { useReadOnlyMode } from '@/hooks/useReadOnlyMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

/**
 * 읽기 전용 모드 배너 컴포넌트
 */
export const ReadOnlyBanner: React.FC = () => {
  const { isReadOnlyMode, readOnlyMessage } = useReadOnlyMode();

  if (!isReadOnlyMode) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <Shield className="h-4 w-4" />
      <AlertDescription className="font-medium">
        🔒 {readOnlyMessage}
      </AlertDescription>
    </Alert>
  );
};

/**
 * 읽기 전용 모드 상태 표시 컴포넌트 (헤더용)
 */
export const ReadOnlyModeIndicator: React.FC = () => {
  const { isReadOnlyMode } = useReadOnlyMode();

  if (!isReadOnlyMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
      <Lock className="h-3 w-3" />
      <span>읽기 전용</span>
    </div>
  );
};

/**
 * 버튼을 읽기 전용 모드에 따라 조건부 렌더링하는 래퍼 컴포넌트
 */
interface ConditionalWriteButtonProps {
  children: React.ReactNode;
  fallbackText?: string;
  showFallback?: boolean;
}

export const ConditionalWriteButton: React.FC<ConditionalWriteButtonProps> = ({
  children,
  fallbackText = "읽기 전용 모드",
  showFallback = true
}) => {
  const { canPerformWriteOperations } = useReadOnlyMode();

  if (canPerformWriteOperations) {
    return <>{children}</>;
  }

  if (showFallback) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
      >
        {fallbackText}
      </button>
    );
  }

  return null;
};
