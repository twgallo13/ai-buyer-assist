import React from 'react';

interface SkeletonProps {
    className?: string;
    children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
            {children}
        </div>
    );
};

interface SkeletonHeadlineProps {
    count?: number;
}

export const SkeletonHeadlines: React.FC<SkeletonHeadlineProps> = ({ count = 4 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
};

export default Skeleton;