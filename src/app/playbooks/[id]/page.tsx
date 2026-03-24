import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { PlaybookDetailClient } from "./playbook-detail-client";

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the playbook
  const { data: thesis, error } = await supabase
    .from("usr_theses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !thesis) {
    notFound();
  }

  // Fetch matches with company data
  // NOTE: jxn_thesis_matches has no 'scored_at' column — use 'created_at' instead
  // NOTE: core_companies has no 'description' column — use 'sector' instead
  const { data: matches } = await supabase
    .from("jxn_thesis_matches")
    .select(`
      id,
      fit_score,
      dimension_scores,
      score_rationale,
      created_at,
      core_companies (
        id,
        ticker,
        name,
        sector
      )
    `)
    .eq("thesis_id", id)
    .order("fit_score", { ascending: false, nullsFirst: false });

  // Fetch guided responses if applicable
  let guidedResponses = null;
  if (thesis.input_mode === "guided") {
    const { data: responses } = await supabase
      .from("usr_thesis_responses")
      .select("responses")
      .eq("thesis_id", id)
      .single();
    guidedResponses = responses?.responses ?? null;
  }

  const playbook = {
    id: thesis.id as string,
    title: thesis.title as string,
    status: thesis.status as string,
    input_mode: thesis.input_mode as string,
    raw_input: thesis.raw_input as string | null,
    structured_criteria: thesis.structured_criteria as Record<string, unknown> | null,
    created_at: thesis.created_at as string,
    updated_at: thesis.updated_at as string,
  };

  const companyMatches = (matches ?? []).map((m) => {
    const company = m.core_companies as unknown as {
      id: string;
      ticker: string;
      name: string;
      sector: string | null;
    } | null;

    return {
      id: m.id as string,
      fit_score: m.fit_score as number | null,
      score_rationale: m.score_rationale as string | null,
      dimension_scores: m.dimension_scores as Record<string, unknown> | null,
      scored_at: m.created_at as string | null,
      company: company
        ? {
            id: company.id,
            ticker: company.ticker,
            name: company.name,
            sector: company.sector,
          }
        : null,
    };
  });

  return (
    <PlaybookDetailClient
      playbook={playbook}
      matches={companyMatches}
      guidedResponses={guidedResponses}
    />
  );
}
