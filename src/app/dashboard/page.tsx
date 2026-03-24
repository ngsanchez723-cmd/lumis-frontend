import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("usr_users")
    .select("display_name, tier")
    .eq("id", user.id)
    .single();

  // Fetch user's playbooks with match counts
  const { data: theses } = await supabase
    .from("usr_theses")
    .select(`
      id,
      title,
      status,
      input_mode,
      created_at,
      updated_at,
      jxn_thesis_matches ( id )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch watchlist count
  const { count: watchlistCount } = await supabase
    .from("usr_watchlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch recent notes count
  const { count: notesCount } = await supabase
    .from("usr_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Shape playbooks with match counts
  const playbooks = (theses ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    status: t.status as string,
    input_mode: t.input_mode as string,
    created_at: t.created_at as string,
    updated_at: t.updated_at as string,
    match_count: Array.isArray(t.jxn_thesis_matches)
      ? t.jxn_thesis_matches.length
      : 0,
  }));

  // Total matched companies across all playbooks
  const totalMatches = playbooks.reduce((sum, p) => sum + p.match_count, 0);

  return (
    <DashboardClient
      displayName={profile?.display_name ?? ""}
      tier={profile?.tier ?? "free"}
      playbooks={playbooks}
      totalMatches={totalMatches}
      watchlistCount={watchlistCount ?? 0}
      notesCount={notesCount ?? 0}
    />
  );
}
