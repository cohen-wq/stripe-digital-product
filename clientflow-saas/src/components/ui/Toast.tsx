import React, { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  const typeStyles = {
    success: 'border-l-4 border-success-green',
    error: 'border-l-4 border-error-red',
    warning: 'border-l-4 border-warning-amber',
    info: 'border-l-4 border-primary-blue',
  };

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`bg-white rounded-card shadow-large p-4 ${typeStyles[type]} animate-in slide-in-from-right-5`}>
      <div className="flex items-start">
        <div className="ml-3">
          <p className="text-body text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;