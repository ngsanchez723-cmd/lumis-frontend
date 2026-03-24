import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function ThemesPage() {
  const supabase = await createClient();

  // Fetch all themes with linked sector counts
  const { data: themes } = await supabase
    .from("ref_themes")
    .select(`
      id,
      name,
      slug,
      icon,
      description,
      jxn_theme_sectors ( sector_id )
    `)
    .order("name");

  // Check which themes have overviews
  const { data: overviews } = await supabase
    .from("ref_theme_overviews")
    .select("theme_id");

  const overviewSet = new Set((overviews ?? []).map((o) => o.theme_id));

  const themeList = (themes ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    icon: t.icon as string | null,
    description: t.description as string | null,
    sector_count: Array.isArray(t.jxn_theme_sectors)
      ? t.jxn_theme_sectors.length
      : 0,
    has_overview: overviewSet.has(t.id),
  }));

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
        Investment Themes
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        Cross-cutting investment narratives that span multiple sectors.
        Each theme represents a macro trend shaping the market.
      </p>

      {themeList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeList.map((theme) => (
            <Link
              key={theme.id}
              href={`/discover/themes/${theme.slug}`}
              className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors group"
            >
              <div className="flex items-start gap-3 mb-2">
                {theme.icon && (
                  <span className="text-xl mt-0.5">{theme.icon}</span>
                )}
                <h2 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700">
                  {theme.name}
                </h2>
              </div>
              {theme.description && (
                <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 mb-3">
                  {theme.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                {theme.sector_count > 0 && (
                  <span>
                    {theme.sector_count}{" "}
                    {theme.sector_count === 1 ? "sector" : "sectors"}
                  </span>
                )}
                {theme.has_overview && (
                  <>
                    {theme.sector_count > 0 && <span>·</span>}
                    <span className="text-emerald-600">Overview available</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-lg p-12 text-center">
          <p className="text-neutral-600 font-medium mb-1">No themes yet</p>
          <p className="text-sm text-neutral-400">
            Investment themes will appear here once they&apos;re configured.
          </p>
        </div>
      )}
    </div>
  );
}
