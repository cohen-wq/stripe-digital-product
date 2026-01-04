import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 ease-out focus:outline-none focus:shadow-focus-ring min-h-[40px] min-w-[40px]';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-body',
      lg: 'px-6 py-3 text-body-large',
    };
    
    const variantStyles = {
      primary: `bg-primary-blue text-white shadow-medium hover:bg-primary-blue-light hover:shadow-large active:bg-primary-blue-dark active:shadow-small ${
        disabled ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed' : ''
      }`,
      secondary: `bg-white text-gray-700 border border-gray-200 shadow-small hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 ${
        disabled ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' : ''
      }`,
    };
    
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className} lift-on-hover`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="w-4 h-4 mr-2">{leftIcon}</span>}
        <span className="flex items-center">{children}</span>
        {!isLoading && rightIcon && <span className="w-4 h-4 ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;