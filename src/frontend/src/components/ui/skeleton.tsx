import { Skeleton } from '@heroui/react';

interface UiPageSkeletonProps {
  blocks?: number;
}

export function UiPageSkeleton({ blocks = 2 }: UiPageSkeletonProps) {
  return (
    <div className="w-full space-y-5 rounded-lg bg-transparent p-1">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-4/5 rounded-lg" />
      </div>

      {Array.from({ length: blocks }).map((_, index) => (
        <div key={index} className="shadow-panel space-y-5 rounded-lg bg-transparent p-4">
          <Skeleton className="h-24 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-4/5 rounded-lg" />
            <Skeleton className="h-3 w-2/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
