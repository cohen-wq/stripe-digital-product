import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  padding?: 'compact' | 'standard' | 'spacious';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, padding = 'standard', className = '', ...props }, ref) => {
    const paddingStyles = {
      compact: 'p-3',
      standard: 'p-4',
      spacious: 'p-6',
    };
    
    const baseStyles = 'bg-white border border-gray-200 rounded-card shadow-small';
    const hoverStyles = hoverable
      ? 'transition-all duration-150 ease-out hover:shadow-medium hover:-translate-y-0.5'
      : '';
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;