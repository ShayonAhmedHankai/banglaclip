import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      {/* Sidebar skeleton */}
      <div className="w-[280px] border-r border-[#3a3a3a] bg-[#1a1a1a] p-4 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-md bg-[#2c2c2c]" />
          <Skeleton className="h-4 w-24 bg-[#2c2c2c]" />
        </div>

        <div className="space-y-2 px-2">
          <Skeleton className="h-10 w-full rounded-lg bg-[#2c2c2c]" />
          <Skeleton className="h-10 w-full rounded-lg bg-[#2c2c2c]" />
          <Skeleton className="h-10 w-full rounded-lg bg-[#2c2c2c]" />
          <Skeleton className="h-10 w-full rounded-lg bg-[#2c2c2c]" />
          <Skeleton className="h-10 w-full rounded-lg bg-[#2c2c2c]" />
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-9 w-9 rounded-full bg-[#2c2c2c]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20 bg-[#2c2c2c]" />
              <Skeleton className="h-2 w-32 bg-[#2c2c2c]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4 bg-[#1a1a1a]">
        <Skeleton className="h-12 w-48 rounded-lg bg-[#2c2c2c]" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Skeleton className="h-32 rounded-xl bg-[#2c2c2c]" />
          <Skeleton className="h-32 rounded-xl bg-[#2c2c2c]" />
          <Skeleton className="h-32 rounded-xl bg-[#2c2c2c]" />
          <Skeleton className="h-32 rounded-xl bg-[#2c2c2c]" />
        </div>
        <Skeleton className="h-64 rounded-xl bg-[#2c2c2c]" />
      </div>
    </div>
  );
}
