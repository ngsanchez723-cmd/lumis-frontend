import { Skeleton } from "@/components/skeletons";

export default function SettingsLoading() {
  return (
    <div className="p-8 max-w-4xl">
      <Skeleton className="w-24 h-7 rounded mb-2" />
      <Skeleton className="w-48 h-3.5 rounded mb-8" />

      <div className="space-y-6">
        {/* Display name field */}
        <div className="space-y-2">
          <Skeleton className="w-24 h-3 rounded" />
          <Skeleton className="w-full h-10 rounded-md" />
        </div>
        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-full h-10 rounded-md" />
        </div>
        {/* Tier */}
        <div className="space-y-2">
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-24 h-5 rounded-full" />
        </div>
        {/* Sign out */}
        <div className="pt-6 border-t border-neutral-100">
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
