import {
  Skeleton,
  SkeletonStatCard,
  SkeletonRow,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="w-56 h-7 rounded mb-2" />
        <Skeleton className="w-36 h-3.5 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Recent playbooks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-32 h-4 rounded" />
          <Skeleton className="w-24 h-3 rounded" />
        </div>
        <div className="divide-y divide-neutral-100">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
}
