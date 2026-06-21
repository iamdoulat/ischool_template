/**
 * Reusable skeleton loader for table-based list pages.
 * Matches the real layout (toolbar, table header, rows, pagination)
 * so the page doesn't jump on first paint.
 */

function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200/60 ${className}`}
            {...props}
        />
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    hasToolbar?: boolean;
    hasPagination?: boolean;
    hasForm?: boolean;
    hasFilters?: boolean;
}

export function TableSkeleton({
    rows = 5,
    columns = 6,
    hasToolbar = true,
    hasPagination = true,
    hasForm = false,
    hasFilters = false,
}: TableSkeletonProps) {
    return (
        <div className="p-4 space-y-4">
            {/* Filters section (used by add-student page) */}
            {hasFilters && (
                <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-8 w-28" />
                    </div>
                </div>
            )}

            {/* Form + Table layout (Pattern B) */}
            {hasForm ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-1/3 xl:w-1/4">
                        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="p-4 space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                ))}
                                <div className="flex justify-end pt-2">
                                    <Skeleton className="h-9 w-28" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                            <Skeleton className="h-5 w-32" />
                            {renderToolbarSkeleton()}
                            {renderTableSkeleton(rows, columns)}
                            {hasPagination && renderPaginationSkeleton()}
                        </div>
                    </div>
                </div>
            ) : (
                /* Full-width table layout (Pattern A) */
                <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                    {hasToolbar && renderToolbarSkeleton()}
                    {renderTableSkeleton(rows, columns)}
                    {hasPagination && renderPaginationSkeleton()}
                </div>
            )}
        </div>
    );

    function renderToolbarSkeleton() {
        return (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2 w-full md:w-fit">
                    <Skeleton className="h-9 w-64 rounded-full" />
                    <Skeleton className="h-9 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-16" />
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 w-7 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function renderTableSkeleton(rowCount: number, colCount: number) {
        return (
            <div className="space-y-1 rounded border border-gray-50 overflow-hidden">
                {/* Header */}
                <div className="flex bg-gray-50/50 p-3 gap-4">
                    {Array.from({ length: colCount }).map((_, i) => (
                        <Skeleton key={i} className="h-3 flex-1" />
                    ))}
                    <Skeleton className="h-3 w-16" />
                </div>
                {/* Rows */}
                {Array.from({ length: rowCount }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex p-3 gap-4 border-t border-gray-50">
                        {Array.from({ length: colCount }).map((_, colIdx) => (
                            <Skeleton key={colIdx} className="h-3 flex-1" />
                        ))}
                        <div className="flex gap-1.5">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function renderPaginationSkeleton() {
        return (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2 items-center">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 w-7 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
            </div>
        );
    }
}

/**
 * Card-based skeleton for the schedule-email-sms-log page.
 */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="p-4 rounded-lg border border-gray-100 bg-white"
                >
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-4 w-4 mt-1 shrink-0" />
                        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                            <div className="flex gap-4">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            <Skeleton className="h-7 w-7 rounded" />
                            <Skeleton className="h-7 w-7 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
