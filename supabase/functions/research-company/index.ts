// =============================================================
// research-company — Supabase Edge Function
// Model: Gemini (configurable via GEMINI_MODEL) + Google Search Grounding
// Purpose: Ticker → qualitative company research profile (7 sections)
// Pipeline: Step 3 of 4 (Parse → Source → Research → Score)
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─── ENV & CLIENTS ──────────────────────────────────────────

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── CONSTANTS ──────────────────────────────────────────────

const CACHE_DAYS = 7;
const BATCH_DELAY_MS = 2000;
const MAX_RETRIES = 2;

const RESEARCH_SECTIONS = [
  "overview",
  "products_services",
  "competitive_position",
  "strategic_dynamics",
  "recent_developments",
  "risks",
  "financials_narrative",
] as const;

type ResearchSectionKey = (typeof RESEARCH_SECTIONS)[number];

// Display titles for each section (used in core_research_sections.section_title)
const SECTION_TITLES: Record<ResearchSectionKey, string> = {
  overview: "Overview",
  products_services: "Products & Services",
  competitive_position: "Competitive Position",
  strategic_dynamics: "Strategic Dynamics",
  recent_developments: "Recent Developments",
  risks: "Risks",
  financials_narrative: "Financials",
};

// ─── TYPES ──────────────────────────────────────────────────

interface ResearchCompanyRequest {
  company_id?: string;
  ticker?: string;
  tickers?: string[];
  user_id?: string;
  force_refresh?: boolean;
}

interface CompanyRecord {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string | null;
}

interface ResearchProfile {
  overview: string;
  products_services: string;
  competitive_position: string;
  strategic_dynamics: string;
  recent_developments: string;
  risks: string;
  financials_narrative: string;
  sources_consulted: { url: string; title: string }[];
}

interface GeminiUsage {
  input_tokens: number;
  output_tokens: number;
}

interface ProfileResult {
  company_id: string;
  ticker: string;
  name: string;
  profile_id: string;
  cached: boolean;
  profile: ResearchProfile;
}

// ─── GEMINI PROMPT ──────────────────────────────────────────

function buildResearchPrompt(company: CompanyRecord): string {
  const sectorContext = company.sector
    ? `This company operates in the ${company.sector} sector.`
    : "";

  const exchangeContext = company.exchange
    ? `It trades on the ${company.exchange}.`
    : "";

  return `You are a senior equity research analyst writing for a retail investment research platform. Your audience is informed but non-professional investors — write with clarity and specificity, avoiding unnecessary jargon.

## COMPANY TO RESEARCH
**${company.name}** (${company.ticker})
${sectorContext} ${exchangeContext}

## INSTRUCTIONS

Research this company thoroughly using current web sources. Produce a comprehensive qualitative profile organized into exactly 7 sections. Each section should be 2-4 paragraphs of substantive analysis — not surface-level summaries.

## SECTIONS

1. **overview** — What does this company do? What is its core business? Who are its customers? What market does it serve? Write this as if explaining the company to someone hearing about it for the first time, but don't be simplistic.

2. **products_services** — What are the company's key products and services? What are its primary revenue streams? What is it best known for? Are there emerging product lines or segments investors should watch?

3. **competitive_position** — Where does this company sit in its market? Who are its main competitors? What differentiates it — is there a moat? Market share data if available. Strengths and vulnerabilities relative to peers.

4. **strategic_dynamics** — What strategic moves has this company made recently (acquisitions, partnerships, pivots, new markets)? What direction is management steering the company? Any notable leadership changes or strategic shifts?

5. **recent_developments** — What's happened in the past 6-12 months? Earnings highlights, major announcements, product launches, regulatory events, analyst upgrades/downgrades. Be specific with dates and figures where available.

6. **risks** — What are the key risk factors? Competitive threats, regulatory exposure, customer concentration, macroeconomic sensitivity, technological disruption, litigation. Be candid — investors need to know the downside.

7. **financials_narrative** — Revenue trajectory, growth rate, margins (gross and operating), profitability status, cash position, debt levels. Write as narrative, not a table. Compare to peers where relevant. Focus on trends and inflection points, not just the latest quarter.

## RULES
- Use ONLY factual, verifiable information from current web sources
- Include specific numbers, dates, and figures where available
- Maintain a balanced tone — acknowledge both strengths and weaknesses
- Do NOT include investment recommendations or buy/sell language
- Do NOT use phrases like "investors should" or "this stock is a good buy"
- If information is limited or unavailable for a section, say so honestly rather than padding
- Write each section as flowing paragraphs, not bullet lists
- Track which sources you consulted

## RESPONSE FORMAT
Respond with ONLY valid JSON — no markdown, no explanation:

{
  "overview": "...",
  "products_services": "...",
  "competitive_position": "...",
  "strategic_dynamics": "...",
  "recent_developments": "...",
  "risks": "...",
  "financials_narrative": "...",
  "sources_consulted": [
    {"url": "https://...", "title": "Source description"},
    {"url": "https://...", "title": "Source description"}
  ]
}`;
}

// ─── GEMINI API CALL ────────────────────────────────────────

async function callGeminiResearch(
  company: CompanyRecord
): Promise<{ profile: ResearchProfile; usage: GeminiUsage }> {
  const prompt = buildResearchPrompt(company);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 16384,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  const usageMetadata = data.usageMetadata || {};
  const usage: GeminiUsage = {
    input_tokens: usageMetadata.promptTokenCount || 0,
    output_tokens: usageMetadata.candidatesTokenCount || 0,
  };

  // Extract text from response parts
  const text =
    data.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join("") || "";

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  // Clean and parse JSON
  const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (_e) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${cleaned.substring(0, 500)}`
    );
  }

  // Validate all required sections exist
  for (const section of RESEARCH_SECTIONS) {
    if (!parsed[section] || typeof parsed[section] !== "string") {
      throw new Error(`Gemini response missing or invalid section: ${section}`);
    }
  }

  if (!Array.isArray(parsed.sources_consulted)) {
    parsed.sources_consulted = [];
  }

  return { profile: parsed as ResearchProfile, usage };
}

// ─── COST CALCULATION ───────────────────────────────────────

function calculateCostCents(usage: GeminiUsage): number {
  const inputCost = (usage.input_tokens / 1_000_000) * 0.1;
  const outputCost = (usage.output_tokens / 1_000_000) * 0.4;
  const searchCost = 0.035;
  return Math.round((inputCost + outputCost + searchCost) * 100 * 1000) / 1000;
}

// ─── USAGE LOGGING ──────────────────────────────────────────

async function logUsage(
  userId: string | null,
  companyId: string | null,
  usage: GeminiUsage,
  status: "success" | "error" | "retry",
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase.from("sys_ai_usage_log").insert({
    user_id: userId,
    edge_function: "research-company",
    model_used: geminiModel,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cost_cents: calculateCostCents(usage),
    status,
    error_message: errorMessage || null,
    metadata: {
      company_id: companyId,
    },
  });

  if (error) {
    console.error("Failed to log AI usage:", error.message);
  }
}

// ─── CACHE CHECK ────────────────────────────────────────────
// Schema: core_company_profiles columns are:
//   id, company_id, profile_content (JSONB), profile_version, model_used, generated_at

async function getCachedProfile(
  companyId: string
): Promise<{ profile_id: string; profile: ResearchProfile } | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_DAYS);

  const { data, error } = await supabase
    .from("core_company_profiles")
    .select("id, profile_content, generated_at")
    .eq("company_id", companyId)
    .gte("generated_at", cutoff.toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    profile_id: data.id,
    profile: data.profile_content as ResearchProfile,
  };
}

// ─── RESOLVE COMPANY ────────────────────────────────────────

async function resolveCompany(
  companyId?: string,
  ticker?: string
): Promise<CompanyRecord | null> {
  if (companyId) {
    const { data } = await supabase
      .from("core_companies")
      .select("id, ticker, name, sector, exchange")
      .eq("id", companyId)
      .single();
    return data;
  }

  if (ticker) {
    const { data } = await supabase
      .from("core_companies")
      .select("id, ticker, name, sector, exchange")
      .eq("ticker", ticker.toUpperCase())
      .maybeSingle();

    if (data) return data;

    // Company not in DB yet — create a minimal record
    const { data: newCompany, error } = await supabase
      .from("core_companies")
      .insert({
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
      })
      .select("id, ticker, name, sector, exchange")
      .single();

    if (error) {
      throw new Error(`Failed to create company record for ${ticker}: ${error.message}`);
    }

    return newCompany;
  }

  return null;
}

// ─── RESEARCH SINGLE COMPANY ────────────────────────────────

async function researchSingleCompany(
  companyId?: string,
  ticker?: string,
  userId?: string | null,
  forceRefresh?: boolean
): Promise<ProfileResult> {
  // 1. Resolve company
  const company = await resolveCompany(companyId, ticker);
  if (!company) {
    throw new Error(
      `Company not found: ${companyId ? `id=${companyId}` : `ticker=${ticker}`}`
    );
  }

  // 2. Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedProfile(company.id);
    if (cached) {
      return {
        company_id: company.id,
        ticker: company.ticker,
        name: company.name,
        profile_id: cached.profile_id,
        cached: true,
        profile: cached.profile,
      };
    }
  }

  // 3. Call Gemini with retry
  let profile: ResearchProfile | null = null;
  let totalUsage: GeminiUsage = { input_tokens: 0, output_tokens: 0 };
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callGeminiResearch(company);
      profile = result.profile;
      totalUsage.input_tokens += result.usage.input_tokens;
      totalUsage.output_tokens += result.usage.output_tokens;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(
        `research-company attempt ${attempt + 1} failed for ${company.ticker}:`,
        lastError
      );

      if (attempt < MAX_RETRIES) {
        await logUsage(userId || null, company.id, totalUsage, "retry", lastError);
        await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt)));
      }
    }
  }

  if (!profile) {
    await logUsage(userId || null, company.id, totalUsage, "error", lastError);
    throw new Error(
      `Failed to research ${company.ticker} after ${MAX_RETRIES + 1} attempts: ${lastError}`
    );
  }

  // 4. Insert profile record
  // Schema: core_company_profiles(id, company_id, profile_content, profile_version, model_used, generated_at)
  const { data: profileRecord, error: profileError } = await supabase
    .from("core_company_profiles")
    .insert({
      company_id: company.id,
      profile_content: profile,
      model_used: geminiModel,
    })
    .select("id")
    .single();

  if (profileError || !profileRecord) {
    throw new Error(
      `Failed to save profile for ${company.ticker}: ${profileError?.message}`
    );
  }

  // 5. Insert individual research sections
  // Schema: core_research_sections(id, company_id, profile_id, section_type, section_title, research_content, sources_used, model_used, ...)
  const sectionInserts = RESEARCH_SECTIONS.map((sectionKey) => ({
    company_id: company.id,
    profile_id: profileRecord.id,
    section_type: sectionKey,
    section_title: SECTION_TITLES[sectionKey],
    research_content: profile![sectionKey],
    sources_used: profile!.sources_consulted || [],
    model_used: geminiModel,
  }));

  const { error: sectionsError } = await supabase
    .from("core_research_sections")
    .insert(sectionInserts);

  if (sectionsError) {
    console.error(
      `Failed to save research sections for ${company.ticker}:`,
      sectionsError.message
    );
  }

  // 6. Update company record with latest profile reference
  await supabase
    .from("core_companies")
    .update({
      latest_profile_id: profileRecord.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  // 7. Log usage
  await logUsage(userId || null, company.id, totalUsage, "success");

  return {
    company_id: company.id,
    ticker: company.ticker,
    name: company.name,
    profile_id: profileRecord.id,
    cached: false,
    profile,
  };
}

// ─── HANDLER ────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = (await req.json()) as ResearchCompanyRequest;
    const { company_id, ticker, tickers, user_id, force_refresh } = body;

    // Validate input
    if (!company_id && !ticker && !tickers) {
      return new Response(
        JSON.stringify({
          error: "One of company_id, ticker, or tickers (batch) is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Batch mode
    if (tickers && tickers.length > 0) {
      const results: ProfileResult[] = [];
      const errors: { ticker: string; error: string }[] = [];

      for (let i = 0; i < tickers.length; i++) {
        try {
          const result = await researchSingleCompany(
            undefined,
            tickers[i],
            user_id,
            force_refresh
          );
          results.push(result);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`Batch research failed for ${tickers[i]}:`, errorMsg);
          errors.push({ ticker: tickers[i], error: errorMsg });
        }

        if (i < tickers.length - 1) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
      }

      const latencyMs = Date.now() - startTime;

      return new Response(
        JSON.stringify({
          mode: "batch",
          results,
          errors,
          summary: {
            total: tickers.length,
            succeeded: results.length,
            failed: errors.length,
            cached: results.filter((r) => r.cached).length,
          },
          model_used: geminiModel,
          latency_ms: latencyMs,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Single mode
    const result = await researchSingleCompany(
      company_id,
      ticker,
      user_id,
      force_refresh
    );
    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        mode: "single",
        ...result,
        model_used: geminiModel,
        latency_ms: latencyMs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("research-company error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
