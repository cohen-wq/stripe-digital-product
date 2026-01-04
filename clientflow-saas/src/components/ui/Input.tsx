import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    
    const baseInputStyles = 'w-full h-10 px-3 py-2 bg-white border rounded-button text-body text-gray-900 placeholder-gray-500 transition-all duration-150 ease-out focus:outline-none';
    
    const stateStyles = hasError
      ? 'border-error-red focus:border-error-red focus:ring-2 focus:ring-error-red focus:ring-opacity-30'
      : 'border-gray-200 hover:border-gray-300 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue focus:ring-opacity-30';
    
    const disabledStyles = props.disabled
      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
      : '';
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-error-red ml-0.5">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`${baseInputStyles} ${stateStyles} ${disabledStyles} ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${className}`}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        
        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="text-small text-gray-500"
          >
            {helperText}
          </p>
        )}
        
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-small text-error-red"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;