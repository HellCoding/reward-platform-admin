import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[30vh] text-center p-6 max-w-[700px] mx-auto">
      <div className="bg-red-600 text-white p-4 rounded-md mb-4 w-full">
        <h2 className="text-xl font-semibold">오류가 발생했습니다</h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {message}
      </p>
      
      {onRetry && (
        <button
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={onRetry}
        >
          <RefreshCw size={18} className="mr-2" />
          다시 시도
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
export { ErrorAlert };
