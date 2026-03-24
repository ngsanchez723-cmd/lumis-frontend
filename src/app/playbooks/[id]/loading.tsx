import {
  Skeleton,
  SkeletonLine,
  SkeletonBadge,
  SkeletonCard,
} from "@/components/skeletons";

export default function PlaybookDetailLoading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Back link */}
      <Skeleton className="w-24 h-3 rounded mb-4" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Skeleton className="w-64 h-7 rounded" />
          <SkeletonBadge className="mt-1" />
        </div>
        <Skeleton className="w-48 h-3.5 rounded" />
      </div>

      {/* Status banner */}
      <div className="bg-neutral-50 rounded-lg p-4 mb-6">
        <SkeletonLine width="w-72" height="h-3.5" />
        <SkeletonLine width="w-56" height="h-2.5" className="mt-2" />
      </div>

      {/* Criteria panel */}
      <div className="border border-neutral-200 rounded-lg p-5 space-y-3">
        <Skeleton className="w-16 h-4 rounded" />
        <SkeletonLine width="w-full" height="h-3" />
        <SkeletonLine width="w-4/5" height="h-3" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="w-20 h-5 rounded" />
          <Skeleton className="w-24 h-5 rounded" />
        </div>
      </div>

      {/* Matched companies */}
      <div className="mt-6">
        <Skeleton className="w-40 h-4 rounded mb-4" />
        <div className="space-y-2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </div>
  );
}
