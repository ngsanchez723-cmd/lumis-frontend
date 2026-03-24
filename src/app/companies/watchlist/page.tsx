import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { WatchlistClient } from "./watchlist-client";

export default async function WatchlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch watchlist items with company data and playbook names
  const { data: watchlistRows } = await supabase
    .from("usr_watchlist_items")
    .select(
      `
      id,
      company_id,
      thesis_id,
      priority,
      created_at,
      core_companies (
        id,
        ticker,
        name,
        sector,
        subsector,
        market_cap,
        exchange,
        latest_profile_id
      ),
      usr_theses (
        id,
        title
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Gather company IDs for profile excerpt and note fetches
  const companyIds: string[] = [];
  const profileIds: string[] = [];

  for (const row of watchlistRows ?? []) {
    const co = row.core_companies as unknown as {
      id: string;
      latest_profile_id: string | null;
    } | null;
    if (co) {
      companyIds.push(co.id);
      if (co.latest_profile_id) profileIds.push(co.latest_profile_id);
    }
  }

  // Fetch profile excerpts for profiled companies
  const profileExcerpts: Record<string, { excerpt: string; generatedAt: string }> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("core_company_profiles")
      .select("id, profile_content, generated_at")
      .in("id", profileIds);

    for (const p of profiles ?? []) {
      const content = p.profile_content as Record<string, unknown> | null;
      if (content) {
        const overview =
          typeof content.overview === "string" ? content.overview : "";
        const excerpt =
          overview.length > 180
            ? overview.slice(0, 180).trim() + "…"
            : overview;
        profileExcerpts[p.id as string] = {
          excerpt,
          generatedAt: p.generated_at as string,
        };
      }
    }
  }

  // Fetch notes for watchlisted companies
  const notesMap: Record<
    string,
    Array<{ id: string; content: string; createdAt: string }>
  > = {};
  if (companyIds.length > 0) {
    const { data: notes } = await supabase
      .from("usr_notes")
      .select("id, company_id, content, created_at")
      .eq("user_id", user.id)
      .in("company_id", companyIds)
      .order("created_at", { ascending: false });

    for (const n of notes ?? []) {
      const cid = n.company_id as string;
      if (!notesMap[cid]) notesMap[cid] = [];
      notesMap[cid].push({
        id: n.id as string,
        content: n.content as string,
        createdAt: n.created_at as string,
      });
    }
  }

  // Shape the data
  const watchlistItems = (watchlistRows ?? []).map((row) => {
    const co = row.core_companies as unknown as {
      id: string;
      ticker: string;
      name: string;
      sector: string | null;
      subsector: string | null;
      market_cap: number | null;
      exchange: string | null;
      latest_profile_id: string | null;
    } | null;

    const thesis = row.usr_theses as unknown as {
      id: string;
      title: string;
    } | null;

    const hasProfile = co?.latest_profile_id !== null;
    const profileData = co?.latest_profile_id
      ? profileExcerpts[co.latest_profile_id] ?? null
      : null;

    return {
      id: row.id as string,
      priority: (row.priority as string) ?? "exploring",
      createdAt: row.created_at as string,
      company: co
        ? {
            id: co.id,
            ticker: co.ticker,
            name: co.name,
            sector: co.sector,
            subsector: co.subsector,
            marketCap: co.market_cap,
            exchange: co.exchange,
            hasProfile,
            excerpt: profileData?.excerpt ?? null,
            profileGeneratedAt: profileData?.generatedAt ?? null,
          }
        : null,
      playbook: thesis
        ? { id: thesis.id, title: thesis.title }
        : null,
      notes: co ? notesMap[co.id] ?? [] : [],
    };
  });

  // Fetch user's playbooks for the "Link to playbook" action
  const { data: userPlaybooks } = await supabase
    .from("usr_theses")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const playbooks = (userPlaybooks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
  }));

  return (
    <WatchlistClient
      items={watchlistItems}
      playbooks={playbooks}
    />
  );
}
