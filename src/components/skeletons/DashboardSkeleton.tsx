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

// Savings Page Skeleton
export const SavingsSkeleton = () => (
  <div className="min-h-screen pb-20">
    {/* Mobile Header Skeleton */}
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-safe pb-3 md:hidden">
      <div className="flex items-center justify-between h-12">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
    
    {/* Desktop Header */}
    <header className="hidden md:block border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32 mt-1" />
      </div>
    </header>
    
    <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
      {/* Page title mobile */}
      <div className="pt-2 md:hidden">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-1" />
      </div>

      {/* QuickStats - 4 cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* QuickActions - 3 buttons + 1 CTA */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <TransactionsListSkeleton count={5} />
        </div>
      </div>
    </main>
  </div>
);

// Credit Cards Page Skeleton
export const CreditCardsSkeleton = () => (
  <div className="p-4 md:p-6 lg:p-8 space-y-6">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <Skeleton className="h-10 w-80 rounded-lg" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Budgets Page Skeleton
export const BudgetsSkeleton = () => (
  <div className="min-h-screen">
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3">
      <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
        <div className="h-10 flex flex-col justify-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-28 mt-1.5" />
        </div>
      </div>
    </header>
    <main className="container mx-auto px-4 md:px-6 py-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-48 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

// Insights Page Skeleton
export const InsightsSkeleton = () => (
  <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Pending Transactions Skeleton - content only version for use inside main
export const PendingTransactionsContentSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-card rounded-xl p-4 border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

// Pending Transactions Skeleton - full page version
export const PendingTransactionsSkeleton = () => (
  <div className="min-h-screen">
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3">
      <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
        <div className="h-10 flex items-center gap-3">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </div>
    </header>
    <main className="container mx-auto px-4 md:px-6 py-6">
      <PendingTransactionsContentSkeleton />
    </main>
  </div>
);

// Settings Page Skeleton
export const SettingsSkeleton = () => (
  <div className="min-h-screen">
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3">
      <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
        <div className="h-10 flex items-center">
          <Skeleton className="h-6 w-36" />
        </div>
      </div>
    </header>
    <main className="container mx-auto px-4 md:px-6 py-6 space-y-6">
      <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
      <div className="bg-card rounded-xl p-6 border border-border/50 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);
