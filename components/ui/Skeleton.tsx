'use client';

import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = 14,
  rounded = false,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: `${height}px`,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton width={36} height={36} rounded />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton height={12} width="60%" />
          <Skeleton height={10} width="40%" />
        </div>
      </div>
      <Skeleton height={10} width="90%" />
      <Skeleton height={10} width="75%" />
      <div className="flex gap-2 mt-2">
        <Skeleton height={24} width={60} />
        <Skeleton height={24} width={80} />
      </div>
    </div>
  );
}
