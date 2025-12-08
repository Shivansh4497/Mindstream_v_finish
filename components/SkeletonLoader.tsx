import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string;
    height?: string;
    className?: string;
    lines?: number;
}

/**
 * SkeletonLoader - Reusable loading placeholder component
 * 
 * Usage:
 * <SkeletonLoader variant="text" lines={3} />         // Multiple text lines
 * <SkeletonLoader variant="circular" width="40px" />  // Avatar placeholder
 * <SkeletonLoader variant="rectangular" height="200px" /> // Card placeholder
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    lines = 1,
}) => {
    const baseClasses = 'animate-pulse bg-white/10 rounded';

    if (variant === 'circular') {
        return (
            <div
                className={`${baseClasses} rounded-full ${className}`}
                style={{ width: width || '40px', height: height || width || '40px' }}
            />
        );
    }

    if (variant === 'rectangular') {
        return (
            <div
                className={`${baseClasses} ${className}`}
                style={{ width: width || '100%', height: height || '100px' }}
            />
        );
    }

    // Text variant - multiple lines with varying widths
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={baseClasses}
                    style={{
                        width: i === lines - 1 ? '75%' : '100%', // Last line shorter
                        height: height || '16px',
                    }}
                />
            ))}
        </div>
    );
};

/**
 * SkeletonCard - Pre-styled skeleton for card-like content
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-dark-surface/50 rounded-xl p-4 space-y-3 ${className}`}>
        <div className="flex items-center gap-3">
            <SkeletonLoader variant="circular" width="32px" />
            <SkeletonLoader variant="text" width="120px" />
        </div>
        <SkeletonLoader variant="text" lines={2} />
    </div>
);

/**
 * SkeletonEntryCard - Skeleton matching JournalEntry card layout
 */
export const SkeletonEntryCard: React.FC = () => (
    <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl p-4 border border-white/5 space-y-3">
        <div className="flex justify-between items-start">
            <SkeletonLoader variant="text" width="80px" height="12px" />
            <SkeletonLoader variant="circular" width="24px" />
        </div>
        <SkeletonLoader variant="text" lines={3} />
        <div className="flex gap-2">
            <SkeletonLoader variant="rectangular" width="60px" height="24px" className="rounded-full" />
            <SkeletonLoader variant="rectangular" width="80px" height="24px" className="rounded-full" />
        </div>
    </div>
);
