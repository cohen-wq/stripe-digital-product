import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton-bg animate-shimmer rounded ${className}`}
    />
  ));

  return <>{skeletons}</>;
};

export default Skeleton;