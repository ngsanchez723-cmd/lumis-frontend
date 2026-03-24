import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function SectorsPage() {
  const supabase = await createClient();

  // Fetch all sectors (no slug column on ref_sectors)
  const { data: allSectors } = await supabase
    .from("ref_sectors")
    .select("id, name, parent_id")
    .order("name");

  const sectors = allSectors ?? [];
  const topLevel = sectors.filter((s) => !s.parent_id);
  const subsectors = sectors.filter((s) => s.parent_id);

  // Count subsectors per parent
  const subsectorCounts: Record<string, number> = {};
  subsectors.forEach((s) => {
    if (s.parent_id) {
      subsectorCounts[s.parent_id] = (subsectorCounts[s.parent_id] ?? 0) + 1;
    }
  });

  // Check which sectors have overviews
  const { data: overviews } = await supabase
    .from("ref_sector_overviews")
    .select("sector_id");

  const overviewSet = new Set((overviews ?? []).map((o) => o.sector_id));

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href="/discover"
        className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-4 inline-block"
      >
        ← Discover
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
        Market Map
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        {topLevel.length} sectors, {subsectors.length} subsectors — a
        retail-investor-first view of the public markets.
      </p>

      {topLevel.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevel.map((sector) => {
            const subCount = subsectorCounts[sector.id] ?? 0;
            const subs = subsectors
              .filter((s) => s.parent_id === sector.id)
              .slice(0, 4);
            const slug = toSlug(sector.name);

            return (
              <Link
                key={sector.id}
                href={`/discover/sectors/${slug}`}
                className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors group"
              >
                <h2 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 mb-2">
                  {sector.name}
                </h2>

                {/* Preview of subsectors */}
                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {subs.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {subCount > 4 && (
                      <span className="text-xs text-neutral-400">
                        +{subCount - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  {subCount > 0 && (
                    <span>
                      {subCount} {subCount === 1 ? "subsector" : "subsectors"}
                    </span>
                  )}
                  {overviewSet.has(sector.id) && (
                    <>
                      {subCount > 0 && <span>·</span>}
                      <span className="text-emerald-600">
                        Overview available
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-lg p-12 text-center">
          <p className="text-neutral-600 font-medium mb-1">No sectors yet</p>
          <p className="text-sm text-neutral-400">
            The sector taxonomy will appear here once it&apos;s seeded.
          </p>
        </div>
      )}
    </div>
  );
}
