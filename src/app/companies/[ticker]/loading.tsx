import {
  SkeletonProfileHeader,
  SkeletonProfileSection,
} from "@/components/skeletons";

export default function CompanyProfileLoading() {
  return (
    <div className="p-8 max-w-4xl">
      <SkeletonProfileHeader />

      {/* Profile sections */}
      <div className="divide-y divide-neutral-100 mt-8">
        <SkeletonProfileSection />
        <SkeletonProfileSection />
        <SkeletonProfileSection />
        <SkeletonProfileSection />
      </div>
    </div>
  );
}
