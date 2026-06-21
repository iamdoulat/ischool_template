/**
 * Skeleton loader for the admin dashboard.
 * Matches the real layout (6 stat cards, 4 charts, 4 overview cards, 11 summary cards)
 * so the page doesn't jump on first paint.
 */
export function DashboardSkeleton() {
    const pulse = "animate-pulse rounded-xl bg-muted/60";

    return (
        <div className="space-y-8">
            {/* Header skeleton */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                    <div className={`${pulse} h-6 w-64`} />
                    <div className={`${pulse} h-4 w-40`} />
                </div>
                <div className="flex items-center gap-3">
                    <div className={`${pulse} h-9 w-36`} />
                    <div className={`${pulse} h-9 w-28`} />
                </div>
            </div>

            {/* Stat cards — 3 cols on xl */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`${pulse} h-[110px]`} />
                ))}
            </div>

            {/* Charts — 2 col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`${pulse} h-[390px]`} />
                ))}
            </div>

            {/* Overview cards — 4 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`${pulse} h-[150px]`} />
                ))}
            </div>

            {/* Summary cards — 4 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className={`${pulse} h-[76px]`} />
                ))}
            </div>
        </div>
    );
}
