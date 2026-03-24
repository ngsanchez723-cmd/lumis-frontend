import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { CompanyProfileClient } from "./company-profile-client";

interface SearchParams {
  from_playbook?: string;
}

export default async function CompanyProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { ticker } = await params;
  const { from_playbook } = await searchParams;
  const supabase = await createClient();
  const upperTicker = ticker.toUpperCase();

  // Fetch company by ticker
  // Actual columns: id, ticker, name, sector, subsector, market_cap, exchange, metadata, latest_profile_id, latest_financials_id, created_at, updated_at
  const { data: company, error } = await supabase
    .from("core_companies")
    .select("id, ticker, name, sector, subsector, exchange, market_cap, latest_profile_id")
    .eq("ticker", upperTicker)
    .single();

  if (error || !company) {
    notFound();
  }

  // Fetch latest profile
  // Actual columns: id, company_id, profile_content (JSONB), profile_version, model_used, generated_at
  let profile = null;
  let profileGeneratedAt: string | null = null;

  if (company.latest_profile_id) {
    const { data: profileRow } = await supabase
      .from("core_company_profiles")
      .select("id, profile_content, model_used, generated_at")
      .eq("id", company.latest_profile_id)
      .single();

    if (profileRow) {
      profile = profileRow.profile_content as Record<string, unknown> | null;
      profileGeneratedAt = profileRow.generated_at as string;
    }
  }

  // Fallback: fetch most recent profile by company_id if latest_profile_id is null
  if (!profile) {
    const { data: profileRow } = await supabase
      .from("core_company_profiles")
      .select("id, profile_content, model_used, generated_at")
      .eq("company_id", company.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (profileRow) {
      profile = profileRow.profile_content as Record<string, unknown> | null;
      profileGeneratedAt = profileRow.generated_at as string;
    }
  }

  // Fetch sectors via junction table
  // jxn_company_sectors: id, company_id, sector_id, is_primary, created_at
  const { data: companySectors } = await supabase
    .from("jxn_company_sectors")
    .select(`
      is_primary,
      ref_sectors ( id, name )
    `)
    .eq("company_id", company.id);

  const sectors = (companySectors ?? [])
    .map((cs) => {
      const sector = cs.ref_sectors as unknown as { id: string; name: string } | null;
      return sector ? { id: sector.id, name: sector.name } : null;
    })
    .filter((s): s is { id: string; name: string } => s !== null);

  // Check auth for watchlist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOnWatchlist = false;
  if (user) {
    const { count } = await supabase
      .from("usr_watchlist_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("company_id", company.id);
    isOnWatchlist = (count ?? 0) > 0;
  }

  // Fetch playbook fit data if from_playbook param is present
  // jxn_thesis_matches: id, thesis_id, company_id, fit_score, score_rationale, dimension_scores, rubric_snapshot, created_at, sourcing_run_id
  // NOTE: no scored_at or score_model_used columns
  let playbookFit = null;
  if (from_playbook && user) {
    const { data: thesis } = await supabase
      .from("usr_theses")
      .select("id, title")
      .eq("id", from_playbook)
      .eq("user_id", user.id)
      .single();

    if (thesis) {
      const { data: match } = await supabase
        .from("jxn_thesis_matches")
        .select("fit_score, dimension_scores, score_rationale, created_at")
        .eq("thesis_id", thesis.id)
        .eq("company_id", company.id)
        .single();

      if (match) {
        playbookFit = {
          playbookId: thesis.id as string,
          playbookTitle: thesis.title as string,
          fitScore: match.fit_score as number | null,
          dimensionScores: match.dimension_scores as Record<string, { score: number; assessment: string }> | null,
          scoreRationale: match.score_rationale as string | null,
          scoredAt: match.created_at as string,
        };
      }
    }
  }

  return (
    <CompanyProfileClient
      company={{
        id: company.id as string,
        ticker: company.ticker as string,
        name: company.name as string,
        sector: company.sector as string | null,
        subsector: company.subsector as string | null,
        exchange: company.exchange as string | null,
        marketCap: company.market_cap as number | null,
      }}
      profile={profile}
      profileGeneratedAt={profileGeneratedAt}
      sectors={sectors}
      isAuthenticated={!!user}
      isOnWatchlist={isOnWatchlist}
      playbookFit={playbookFit}
    />
  );
}
