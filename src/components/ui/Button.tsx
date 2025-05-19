import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  Icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/30',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary/30',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/30',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded',
  md: 'text-sm px-4 py-2 rounded-md',
  lg: 'text-base px-6 py-3 rounded-md',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  Icon,
  iconPosition = 'left',
  className = '',
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
        font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        inline-flex items-center justify-center
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="mr-2 -ml-1 h-4 w-4" />
      ) : null}
      
      {children}
      
      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className="ml-2 -mr-1 h-4 w-4" />
      ) : null}
    </button>
  );
};

export default Button;