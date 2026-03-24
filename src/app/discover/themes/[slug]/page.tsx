import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ThemeOverviewContent {
  narrative?: string;
  key_sectors?: Array<{ name: string; relevance: string }>;
  tailwinds?: string[];
  risks?: string[];
  featured_companies?: Array<{
    name: string;
    ticker: string;
    relevance: string;
  }>;
  recent_developments?: string;
  investment_angles?: string[];
  sources_consulted?: Array<{ url: string; title: string }>;
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch theme by slug
  const { data: theme, error } = await supabase
    .from("ref_themes")
    .select("id, name, slug, icon, description")
    .eq("slug", slug)
    .single();

  if (error || !theme) {
    notFound();
  }

  // Fetch linked sectors
  const { data: linkedSectors } = await supabase
    .from("jxn_theme_sectors")
    .select(`
      ref_sectors ( id, name, slug )
    `)
    .eq("theme_id", theme.id);

  const sectors = (linkedSectors ?? [])
    .map((ls) => ls.ref_sectors as unknown as { id: string; name: string; slug: string } | null)
    .filter((s): s is { id: string; name: string; slug: string } => s !== null);

  // Fetch overview (if exists)
  const { data: overviewRow } = await supabase
    .from("ref_theme_overviews")
    .select("content, generated_at")
    .eq("theme_id", theme.id)
    .single();

  const overview: ThemeOverviewContent | null = overviewRow?.content
    ? (overviewRow.content as ThemeOverviewContent)
    : null;
  const generatedAt: string | null = overviewRow?.generated_at ?? null;

  // Fetch linked companies (if any)
  const { data: linkedCompanies } = await supabase
    .from("jxn_theme_companies")
    .select(`
      core_companies ( id, ticker, name )
    `)
    .eq("theme_id", theme.id);

  const companies = (linkedCompanies ?? [])
    .map(
      (lc) =>
        lc.core_companies as unknown as {
          id: string;
          ticker: string;
          name: string;
        } | null
    )
    .filter(
      (c): c is { id: string; ticker: string; name: string } => c !== null
    );

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/discover/themes"
        className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-4 inline-block"
      >
        ← All Themes
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {theme.icon && <span className="text-2xl">{theme.icon}</span>}
          <h1 className="text-2xl font-semibold text-neutral-900">
            {theme.name}
          </h1>
        </div>
        {theme.description && (
          <p className="text-neutral-500 leading-relaxed">
            {theme.description}
          </p>
        )}
      </div>

      {/* Linked sectors */}
      {sectors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Related Sectors
          </h2>
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <Link
                key={s.id}
                href={`/discover/sectors/${s.slug}`}
                className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-400 transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overview content or placeholder */}
      {overview ? (
        <div className="space-y-8">
          {/* Narrative */}
          {overview.narrative && (
            <div>
              <p className="text-neutral-700 leading-relaxed">
                {overview.narrative}
              </p>
            </div>
          )}

          {/* Tailwinds & Risks side by side */}
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

          {/* Investment angles */}
          {overview.investment_angles &&
            overview.investment_angles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Investment Angles
                </h3>
                <div className="space-y-2">
                  {overview.investment_angles.map((angle, i) => (
                    <p
                      key={i}
                      className="text-sm text-neutral-600 leading-relaxed"
                    >
                      {angle}
                    </p>
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

          {/* Featured companies from overview */}
          {overview.featured_companies &&
            overview.featured_companies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Featured Companies
                </h3>
                <div className="space-y-2">
                  {overview.featured_companies.map((c, i) => (
                    <Link
                      key={i}
                      href={`/companies/${c.ticker}`}
                      className="flex items-center justify-between border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors"
                    >
                      <div>
                        <span className="text-xs font-mono text-neutral-400 mr-2">
                          {c.ticker}
                        </span>
                        <span className="text-sm font-medium text-neutral-900">
                          {c.name}
                        </span>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {c.relevance}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
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
        <div className="border border-dashed border-neutral-300 rounded-lg p-10 text-center mb-8">
          <p className="text-neutral-600 font-medium mb-1">
            Overview coming soon
          </p>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            An AI-generated intelligence overview for this theme will be
            available once the content pipeline is connected.
          </p>
        </div>
      )}

      {/* Linked companies from jxn_theme_companies */}
      {companies.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">
            Companies in this Theme
          </h2>
          <div className="space-y-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.ticker}`}
                className="flex items-center gap-3 border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 transition-colors"
              >
                <span className="text-xs font-mono text-neutral-400">
                  {c.ticker}
                </span>
                <span className="text-sm text-neutral-900">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 pt-8 border-t border-neutral-100">
        <Link
          href="/playbooks/new"
          className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Build a Playbook around this theme →
        </Link>
      </div>
    </div>
  );
}
