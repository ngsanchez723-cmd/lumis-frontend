import {
  Skeleton,
  SkeletonLine,
  SkeletonSpotlightCard,
  SkeletonTable,
} from "@/components/skeletons";

export default function CompaniesLoading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Hero: title + search */}
      <div className="mb-8">
        <Skeleton className="w-32 h-7 rounded mb-2" />
        <SkeletonLine width="w-80" height="h-3.5" className="mb-4" />
        {/* Search bar placeholder */}
        <div className="w-full h-[50px] border border-neutral-200 rounded-xl bg-neutral-50/50 animate-pulse" />
        <div className="flex gap-6 mt-3">
          <Skeleton className="w-24 h-3 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
          <Skeleton className="w-16 h-3 rounded" />
        </div>
      </div>

      {/* Your companies */}
      <div className="mb-8">
        <div className="mb-3">
          <Skeleton className="w-32 h-4 rounded mb-1" />
          <Skeleton className="w-56 h-2.5 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-20 h-3.5 rounded" />
              </div>
              <Skeleton className="w-28 h-2.5 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Spotlight */}
      <div className="mb-8 pt-8 border-t border-neutral-100">
        <div className="mb-3">
          <Skeleton className="w-20 h-4 rounded mb-1" />
          <Skeleton className="w-64 h-2.5 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <SkeletonSpotlightCard />
          <SkeletonSpotlightCard />
        </div>
      </div>

      {/* Browse table */}
      <div className="pt-8 border-t border-neutral-100">
        <div className="mb-3">
          <Skeleton className="w-40 h-4 rounded mb-1" />
          <Skeleton className="w-56 h-2.5 rounded" />
        </div>
        {/* Filter bar placeholder */}
        <div className="flex items-center gap-2.5 mb-2">
          <Skeleton className="w-28 h-9 rounded-lg" />
          <Skeleton className="w-28 h-9 rounded-lg" />
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
