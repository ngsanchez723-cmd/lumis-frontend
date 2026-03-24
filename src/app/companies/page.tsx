import { createClient } from "@/lib/supabase-server";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesPage() {
  const supabase = await createClient();

  // --- Auth state (for personalization) ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Total company count ---
  const { count: totalCompanies } = await supabase
    .from("core_companies")
    .select("id", { count: "exact", head: true });

  // --- Profiled company count ---
  const { count: profiledCount } = await supabase
    .from("core_companies")
    .select("id", { count: "exact", head: true })
    .not("latest_profile_id", "is", null);

  // --- Spotlight: recently profiled companies (up to 4) ---
  const { data: spotlightRows } = await supabase
    .from("core_companies")
    .select(
      "id, ticker, name, sector, subsector, market_cap, exchange, latest_profile_id"
    )
    .not("latest_profile_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(4);

  // Fetch profile excerpts for spotlight companies
  const spotlightCompanies = [];
  for (const co of spotlightRows ?? []) {
    let excerpt = "";
    let generatedAt: string | null = null;
    if (co.latest_profile_id) {
      const { data: profile } = await supabase
        .from("core_company_profiles")
        .select("profile_content, generated_at")
        .eq("id", co.latest_profile_id)
        .single();
      if (profile?.profile_content) {
        const content = profile.profile_content as Record<string, unknown>;
        const overview =
          typeof content.overview === "string" ? content.overview : "";
        // Take first ~180 chars as excerpt
        excerpt =
          overview.length > 180
            ? overview.slice(0, 180).trim() + "…"
            : overview;
      }
      generatedAt = profile?.generated_at as string | null;
    }
    spotlightCompanies.push({
      id: co.id as string,
      ticker: co.ticker as string,
      name: co.name as string,
      sector: co.sector as string | null,
      subsector: co.subsector as string | null,
      marketCap: co.market_cap as number | null,
      exchange: co.exchange as string | null,
      excerpt,
      generatedAt,
    });
  }

  // --- Sectors for filter dropdown ---
  const { data: sectorRows } = await supabase
    .from("ref_sectors")
    .select("id, name, parent_id")
    .is("parent_id", null)
    .order("name", { ascending: true });

  const sectors = (sectorRows ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
  }));

  // --- User context (only if authenticated) ---
  let watchlistCompanies: Array<{
    id: string;
    ticker: string;
    name: string;
    sector: string | null;
  }> = [];
  let playbookMatchCount = 0;
  let playbookCount = 0;

  if (user) {
    // Watchlist
    const { data: watchlistRows } = await supabase
      .from("usr_watchlist_items")
      .select(
        `
        company_id,
        core_companies ( id, ticker, name, sector )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    watchlistCompanies = (watchlistRows ?? [])
      .map((w) => {
        const co = w.core_companies as unknown as {
          id: string;
          ticker: string;
          name: string;
          sector: string | null;
        } | null;
        return co
          ? {
              id: co.id,
              ticker: co.ticker,
              name: co.name,
              sector: co.sector,
            }
          : null;
      })
      .filter(
        (c): c is { id: string; ticker: string; name: string; sector: string | null } =>
          c !== null
      );

    // Playbook match count
    const { data: theses } = await supabase
      .from("usr_theses")
      .select("id, jxn_thesis_matches ( id )")
      .eq("user_id", user.id);

    playbookCount = theses?.length ?? 0;
    playbookMatchCount = (theses ?? []).reduce(
      (sum, t) =>
        sum +
        (Array.isArray(t.jxn_thesis_matches)
          ? t.jxn_thesis_matches.length
          : 0),
      0
    );
  }

  return (
    <CompaniesClient
      isAuthenticated={!!user}
      totalCompanies={totalCompanies ?? 0}
      profiledCount={profiledCount ?? 0}
      sectorCount={sectors.length}
      spotlightCompanies={spotlightCompanies}
      sectors={sectors}
      watchlistCompanies={watchlistCompanies}
      playbookMatchCount={playbookMatchCount}
      playbookCount={playbookCount}
    />
  );
}
