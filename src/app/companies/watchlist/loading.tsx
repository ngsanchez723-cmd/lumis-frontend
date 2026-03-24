import {
  Skeleton,
  SkeletonWatchlistCard,
} from "@/components/skeletons";

export default function WatchlistLoading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <Skeleton className="w-28 h-7 rounded mb-2" />
      <Skeleton className="w-80 h-3.5 rounded mb-6" />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-neutral-50 rounded-lg p-3.5 space-y-2">
            <Skeleton className="w-16 h-2.5 rounded" />
            <Skeleton className="w-10 h-6 rounded" />
            <Skeleton className="w-20 h-2 rounded" />
          </div>
        ))}
      </div>

      {/* Legend */}
      <Skeleton className="w-full h-9 rounded-lg mb-5" />

      {/* Controls */}
      <div className="flex items-center gap-2.5 mb-4">
        <Skeleton className="w-36 h-9 rounded-lg" />
        <Skeleton className="w-40 h-9 rounded-lg" />
      </div>

      {/* Watchlist cards */}
      <div className="space-y-2">
        <SkeletonWatchlistCard />
        <SkeletonWatchlistCard />
        <SkeletonWatchlistCard />
      </div>
    </div>
  );
}
