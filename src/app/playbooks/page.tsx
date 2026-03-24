import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { PlaybooksClient } from "./playbooks-client";

export default async function PlaybooksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's playbooks with match counts
  const { data: theses } = await supabase
    .from("usr_theses")
    .select(`
      id,
      title,
      status,
      input_mode,
      raw_input,
      structured_criteria,
      created_at,
      updated_at,
      jxn_thesis_matches ( id )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const playbooks = (theses ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    status: t.status as string,
    input_mode: t.input_mode as string,
    raw_input: t.raw_input as string | null,
    structured_criteria: t.structured_criteria as Record<string, unknown> | null,
    created_at: t.created_at as string,
    updated_at: t.updated_at as string,
    match_count: Array.isArray(t.jxn_thesis_matches)
      ? t.jxn_thesis_matches.length
      : 0,
  }));

  return <PlaybooksClient playbooks={playbooks} />;
}
