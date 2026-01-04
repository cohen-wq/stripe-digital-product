import React from 'react';

type PillTagVariant = 'success' | 'warning' | 'neutral';

interface PillTagProps {
  variant?: PillTagVariant;
  children: React.ReactNode;
}

const PillTag: React.FC<PillTagProps> = ({ variant = 'neutral', children }) => {
  const variantStyles = {
    success: 'bg-green-50 text-success-green',
    warning: 'bg-amber-50 text-warning-amber',
    neutral: 'bg-gray-200 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-small font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
};

export default PillTag;