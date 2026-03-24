/**
 * Skeleton loading primitives for Lumis.
 *
 * Brand guideline: "Use skeleton loaders (gray pulsing blocks matching content
 * shape), NOT spinners."
 *
 * Every primitive uses a single shared CSS animation class (`animate-pulse`)
 * from Tailwind so the pulse cadence stays consistent across the app.
 */

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-neutral-100 animate-pulse rounded ${className}`}
    />
  );
}

/** Full-width text line — height defaults to body-text size */
export function SkeletonLine({
  width = "w-full",
  height = "h-3.5",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <Skeleton className={`${width} ${height} ${className}`} />;
}

/** Rounded badge / chip placeholder */
export function SkeletonBadge({ className = "" }: { className?: string }) {
  return <Skeleton className={`w-16 h-5 rounded-full ${className}`} />;
}

/** Stat card used on Dashboard, Watchlist, etc. */
export function SkeletonStatCard() {
  return (
    <div className="border border-neutral-200 rounded-lg p-5">
      <Skeleton className="w-12 h-7 rounded mb-2" />
      <Skeleton className="w-20 h-3 rounded" />
    </div>
  );
}

/** Single row in a list (playbook row, match row, etc.) */
export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 -mx-4">
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonLine width="w-48" height="h-3.5" />
        <SkeletonLine width="w-28" height="h-2.5" />
      </div>
      <SkeletonBadge />
    </div>
  );
}

/** Card skeleton matching PlaybookCard / MatchCard shape */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <SkeletonLine width="w-44" height="h-4" />
        <SkeletonBadge />
      </div>
      {lines >= 2 && <SkeletonLine width="w-full" height="h-3" />}
      {lines >= 3 && <SkeletonLine width="w-3/4" height="h-3" />}
      <div className="flex gap-2 pt-1">
        <SkeletonLine width="w-16" height="h-2.5" />
        <SkeletonLine width="w-16" height="h-2.5" />
      </div>
    </div>
  );
}

/** Table skeleton — header + n rows */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-neutral-50/50 border-b border-neutral-100">
        <Skeleton className="w-14 h-2.5 rounded" />
        <Skeleton className="w-28 h-2.5 rounded" />
        <Skeleton className="w-24 h-2.5 rounded" />
        <Skeleton className="w-16 h-2.5 rounded" />
        <Skeleton className="w-20 h-2.5 rounded ml-auto" />
        <Skeleton className="w-14 h-2.5 rounded" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-t border-neutral-100"
        >
          <Skeleton className="w-14 h-3.5 rounded" />
          <Skeleton className="w-36 h-3.5 rounded" />
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-16 h-3.5 rounded ml-auto" />
          <Skeleton className="w-14 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Spotlight-style card skeleton */
export function SkeletonSpotlightCard() {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-28 h-3.5 rounded" />
        </div>
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
      </div>
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-4/5" height="h-3" />
      <div className="flex gap-1.5">
        <Skeleton className="w-20 h-4 rounded" />
        <Skeleton className="w-20 h-4 rounded" />
      </div>
    </div>
  );
}

/** Watchlist card skeleton */
export function SkeletonWatchlistCard() {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 border-l-[3px] border-l-neutral-200 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-32 h-3.5 rounded" />
        </div>
        <Skeleton className="w-20 h-5 rounded" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>
      <SkeletonLine width="w-full" height="h-3" />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <Skeleton className="w-16 h-2.5 rounded" />
        <Skeleton className="w-20 h-3 rounded" />
      </div>
    </div>
  );
}

/** Profile page header skeleton */
export function SkeletonProfileHeader() {
  return (
    <div className="space-y-4">
      {/* Back link */}
      <Skeleton className="w-24 h-3 rounded" />
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-3 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
          <Skeleton className="w-48 h-7 rounded" />
        </div>
        <Skeleton className="w-36 h-9 rounded-lg" />
      </div>
      {/* Meta */}
      <div className="flex items-center gap-5">
        <Skeleton className="w-28 h-3.5 rounded" />
        <Skeleton className="w-20 h-5 rounded" />
        <Skeleton className="w-20 h-5 rounded" />
      </div>
    </div>
  );
}

/** Profile content section skeleton */
export function SkeletonProfileSection() {
  return (
    <div className="py-6 space-y-3">
      <Skeleton className="w-32 h-4 rounded" />
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-11/12" height="h-3" />
      <SkeletonLine width="w-4/5" height="h-3" />
    </div>
  );
}
