import { Skeleton, SkeletonCard } from "@/components/skeletons";

export default function PlaybooksLoading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="w-36 h-7 rounded mb-2" />
          <Skeleton className="w-64 h-3.5 rounded" />
        </div>
        <Skeleton className="w-28 h-9 rounded-lg" />
      </div>

      {/* Playbook cards */}
      <div className="space-y-3">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
