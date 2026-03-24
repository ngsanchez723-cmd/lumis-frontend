import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SectorOverviewContent {
  definition?: string;
  market_dynamics?: string;
  subsegments?: Array<{
    name: string;
    description: string;
    key_players: string[];
    investor_relevance: string;
  }>;
  major_players?: Array<{ name: string; ticker: string; brief: string }>;
  tailwinds?: string[];
  risks?: string[];
  recent_developments?: string;
  sources_consulted?: Array<{ url: string; title: string }>;
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // ref_sectors has no slug column — fetch all and match by generated slug
  const { data: allSectors } = await supabase
    .from("ref_sectors")
    .select("id, name, parent_id")
    .order("name");

  const sectors = allSectors ?? [];
  const sector = sectors.find((s) => toSlug(s.name) === slug);

  if (!sector) {
    notFound();
  }

  // If this is a subsector, find parent for breadcrumb
  let parentSector: { name: string; slug: string } | null = null;
  if (sector.parent_id) {
    const parent = sectors.find((s) => s.id === sector.parent_id);
    if (parent) {
      parentSector = { name: parent.name, slug: toSlug(parent.name) };
    }
  }

  // Fetch subsectors of this sector
  const subsectors = sectors.filter((s) => s.parent_id === sector.id);

  // Fetch overview (if exists)
  const { data: overviewRow } = await supabase
    .from("ref_sector_overviews")
    .select("content, generated_at")
    .eq("sector_id", sector.id)
    .single();

  const overview: SectorOverviewContent | null = overviewRow?.content
    ? (overviewRow.content as SectorOverviewContent)
    : null;
  const generatedAt: string | null = overviewRow?.generated_at ?? null;

  // Fetch linked themes
  const { data: linkedThemes } = await supabase
    .from("jxn_theme_sectors")
    .select(`
      ref_themes ( id, name, slug, icon )
    `)
    .eq("sector_id", sector.id);

  const themes = (linkedThemes ?? [])
    .map(
      (lt) =>
        lt.ref_themes as unknown as {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
        } | null
    )
    .filter(
      (t): t is { id: string; name: string; slug: string; icon: string | null } =>
        t !== null
    );

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-400 mb-4 flex items-center gap-1.5">
        <Link
          href="/discover/sectors"
          className="hover:text-neutral-700 transition-colors"
        >
          Market Map
        </Link>
        {parentSector && (
          <>
            <span>/</span>
            <Link
              href={`/discover/sectors/${parentSector.slug}`}
              className="hover:text-neutral-700 transition-colors"
            >
              {parentSector.name}
            </Link>
          </>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          {sector.name}
        </h1>
        {overview?.definition && (
          <p className="text-neutral-500 leading-relaxed">
            {overview.definition}
          </p>
        )}
      </div>

      {/* Subsectors */}
      {subsectors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Subsectors
          </h2>
          <div className="flex flex-wrap gap-2">
            {subsectors.map((sub) => (
              <Link
                key={sub.id}
                href={`/discover/sectors/${toSlug(sub.name)}`}
                className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-400 transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related themes */}
      {themes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Related Themes
          </h2>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <Link
                key={t.id}
                href={`/discover/themes/${t.slug}`}
                className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-400 transition-colors"
              >
                {t.icon && <span className="mr-1.5">{t.icon}</span>}
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overview content or placeholder */}
      {overview ? (
        <div className="space-y-8">
          {/* Market dynamics */}
          {overview.market_dynamics && (
            <div>
              <h2 className="text-sm font-medium text-neutral-900 mb-2">
                Market Dynamics
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {overview.market_dynamics}
              </p>
            </div>
          )}

          {/* Tailwinds & Risks */}
          {(overview.tailwinds?.length || overview.risks?.length) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.tailwinds && overview.tailwinds.length > 0 && (
                <div className="border border-neutral-200 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    Tailwinds
                  </h3>
                  <div className="space-y-2">
                    {overview.tailwinds.map((t, i) => (
                      <p
                        key={i}
                        className="text-sm text-neutral-600 leading-relaxed"
                      >
                        {t}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {overview.risks && overview.risks.length > 0 && (
                <div className="border border-neutral-200 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    Risks
                  </h3>
                  <div className="space-y-2">
                    {overview.risks.map((r, i) => (
                      <p
                        key={i}
                        className="text-sm text-neutral-600 leading-relaxed"
                      >
                        {r}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Major players */}
          {overview.major_players && overview.major_players.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">
                Major Players
              </h3>
              <div className="space-y-2">
                {overview.major_players.map((p, i) => (
                  <Link
                    key={i}
                    href={`/companies/${p.ticker}`}
                    className="flex items-center justify-between border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-mono text-neutral-400 mr-2">
                        {p.ticker}
                      </span>
                      <span className="text-sm font-medium text-neutral-900">
                        {p.name}
                      </span>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {p.brief}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent developments */}
          {overview.recent_developments && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-2">
                Recent Developments
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {overview.recent_developments}
              </p>
            </div>
          )}

          {/* Generation timestamp */}
          {generatedAt && (
            <p className="text-xs text-neutral-400">
              Overview generated{" "}
              {new Date(generatedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-lg p-10 text-center">
          <p className="text-neutral-600 font-medium mb-1">
            Overview coming soon
          </p>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            An AI-generated intelligence overview for this sector will be
            available once the content pipeline is connected.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 pt-8 border-t border-neutral-100">
        <Link
          href="/playbooks/new"
          className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Build a Playbook in this sector →
        </Link>
      </div>
    </div>
  );
}
