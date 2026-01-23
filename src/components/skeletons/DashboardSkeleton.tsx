import { Skeleton } from "@/components/ui/skeleton";

export const DashboardHeaderSkeleton = () => (
  <header className="bg-gradient-to-b from-card to-background">
    <div className="container mx-auto px-4 pt-4 pb-6">
      {/* Exchange rate */}
      <div className="flex justify-end mb-4">
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Balance */}
      <div className="text-center mb-4">
        <Skeleton className="h-3 w-20 mx-auto mb-2" />
        <Skeleton className="h-10 w-48 mx-auto mb-2" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>
      
      {/* Month selector */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  </header>
);

export const QuickStatsSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const QuickActionsSkeleton = () => (
  <div className="flex gap-2">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
    ))}
  </div>
);

export const TransactionsListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {/* Group header */}
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="h-3 w-12" />
      <div className="flex-1 h-px bg-border/50" />
    </div>
    
    {/* Transaction items */}
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-card rounded-xl p-4 border border-border/50">
    <Skeleton className="h-5 w-32 mb-4" />
    <Skeleton className="h-48 w-full rounded-lg" />
  </div>
);

export const BudgetProgressSkeleton = () => (
  <div className="bg-card rounded-xl p-4 border border-border/50">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const InsightsCardSkeleton = () => (
  <div className="bg-card rounded-xl p-4 border border-border/50">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-5 w-24" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-4/5" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen">
    <DashboardHeaderSkeleton />
    <main className="container mx-auto px-4 py-4 space-y-4">
      <QuickStatsSkeleton />
      <QuickActionsSkeleton />
      <BudgetProgressSkeleton />
      <InsightsCardSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <Skeleton className="h-5 w-40 mb-4" />
        <TransactionsListSkeleton count={5} />
      </div>
    </main>
  </div>
);
