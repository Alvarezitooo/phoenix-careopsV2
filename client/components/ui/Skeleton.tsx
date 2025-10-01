import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      {...props}
    />
  );
}

// Skeleton components for common patterns
export function DocumentSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center">
        <Skeleton className="h-5 w-5 mr-3" />
        <div>
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

export function ProcedureSkeleton() {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 mr-3" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-2 pl-8">
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <Skeleton className="h-12 w-12 rounded-xl mb-4" />
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}