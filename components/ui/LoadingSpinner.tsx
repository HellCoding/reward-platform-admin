import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '데이터 로딩 중...' }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] text-center p-6">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
      <h2 className="text-xl text-gray-600 dark:text-gray-300 mt-4">
        {message}
      </h2>
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner };
