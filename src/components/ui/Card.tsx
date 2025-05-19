import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  onClick,
}) => {
  return (
    <div 
      className={`bg-white shadow-md rounded-lg overflow-hidden ${className} ${onClick ? 'cursor-pointer transition-transform hover:scale-[1.01]' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <div className={`px-4 py-3 bg-gray-50 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <div className={`px-4 py-3 bg-gray-50 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};