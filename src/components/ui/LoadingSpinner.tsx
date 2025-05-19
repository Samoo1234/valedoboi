import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '',
}) => {
  return (
    <div className={`${className} flex justify-center items-center`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`}></div>
    </div>
  );
};

export default LoadingSpinner;