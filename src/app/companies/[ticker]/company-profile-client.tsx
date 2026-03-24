"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  exchange: string | null;
  marketCap: number | null;
}

interface PlaybookFit {
  playbookId: string;
  playbookTitle: string;
  fitScore: number | null;
  dimensionScores: Record<
    string,
    { score: number; assessment: string }
  > | null;
  scoreRationale: string | null;
  scoredAt: string | null;
}

interface CompanyProfileClientProps {
  company: Company;
  profile: Record<string, unknown> | null;
  profileGeneratedAt: string | null;
  sectors: Array<{ id: string; name: string }>;
  isAuthenticated: boolean;
  isOnWatchlist: boolean;
  playbookFit: PlaybookFit | null;
}

const sectionMeta: Array<{ key: string; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "products_services", label: "Products & Services" },
  { key: "competitive_position", label: "Competitive Position" },
  { key: "strategic_dynamics", label: "Strategic Dynamics" },
  { key: "recent_developments", label: "Recent Developments" },
  { key: "risks", label: "Risks" },
  { key: "financials_narrative", label: "Financials" },
];

const dimensionLabels: Record<string, string> = {
  competitive_moat: "Competitive Moat",
  revenue_growth: "Revenue Growth",
  innovation: "Innovation",
  market_timing: "Market Timing",
  management_quality: "Management Quality",
  valuation: "Valuation",
  regulatory_risk: "Regulatory Risk",
  brand_strength: "Brand Strength",
  sector_momentum: "Sector Momentum",
  partnerships: "Partnerships",
  balance_sheet_health: "Balance Sheet Health",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000_000_000)
    return `$${(cap / 1_000_000_000_000).toFixed(1)}T`;
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(1)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  let colorClass = "bg-neutral-100 text-neutral-700";
  if (score >= 80) colorClass = "bg-emerald-50 text-emerald-700";
  else if (score >= 60) colorClass = "bg-amber-50 text-amber-700";
  else if (score >= 40) colorClass = "bg-orange-50 text-orange-600";
  else colorClass = "bg-neutral-100 text-neutral-600";

  const sizeClass =
    size === "lg"
      ? "text-xl font-bold px-4 py-2 rounded-xl"
      : size === "sm"
      ? "text-xs font-semibold px-2 py-0.5 rounded-md"
      : "text-sm font-semibold px-2.5 py-1 rounded-lg";

  return <span className={`${sizeClass} ${colorClass}`}>{score}</span>;
}

function ProfileSection({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <div className="py-6 first:pt-0">
      <h3 className="text-sm font-medium text-neutral-900 mb-2">{label}</h3>
      <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

function WatchlistButton({
  companyId,
  initialOnWatchlist,
  isAuthenticated,
  playbookId,
}: {
  companyId: string;
  initialOnWatchlist: boolean;
  isAuthenticated: boolean;
  playbookId?: string | null;
}) {
  const [onWatchlist, setOnWatchlist] = useState(initialOnWatchlist);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="text-sm px-4 py-2 border border-neutral-200 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
      >
        Sign in to watchlist
      </Link>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get the current user's ID — required for both insert and delete
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    if (onWatchlist) {
      // Remove: scope delete to this user + this company
      await supabase
        .from("usr_watchlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("company_id", companyId);
      setOnWatchlist(false);
    } else {
      // Add: include user_id (required), company_id, and optional thesis_id
      const insertData: Record<string, string> = {
        user_id: user.id,
        company_id: companyId,
      };
      if (playbookId) {
        insertData.thesis_id = playbookId;
      }
      // priority defaults to 'exploring' via schema DEFAULT
      const { error } = await supabase
        .from("usr_watchlist_items")
        .insert(insertData);

      // Only flip the visual state if the insert actually succeeded
      if (!error) {
        setOnWatchlist(true);
      }
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        onWatchlist
          ? "bg-neutral-900 text-white hover:bg-neutral-700"
          : "border border-neutral-200 text-neutral-700 hover:border-neutral-400"
      }`}
    >
      {loading
        ? "..."
        : onWatchlist
        ? "✓ On Watchlist"
        : "+ Add to Watchlist"}
    </button>
  );
}

function PlaybookFitSection({ fit }: { fit: PlaybookFit }) {
  const dimensions = fit.dimensionScores
    ? Object.entries(fit.dimensionScores).sort(
        ([, a], [, b]) => (b?.score ?? 0) - (a?.score ?? 0)
      )
    : [];

  return (
    <div className="border border-neutral-200 rounded-lg p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-neutral-400">Playbook Fit</p>
          <Link
            href={`/playbooks/${fit.playbookId}`}
            className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            {fit.playbookTitle} →
          </Link>
        </div>
        {fit.fitScore !== null && (
          <ScoreBadge score={fit.fitScore} size="lg" />
        )}
      </div>

      {fit.scoreRationale && (
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
          {fit.scoreRationale}
        </p>
      )}

      {dimensions.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-neutral-100">
          {dimensions.map(([key, dim]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-neutral-700">
                  {dimensionLabels[key] ?? key.replace(/_/g, " ")}
                </span>
                <ScoreBadge score={dim.score} size="sm" />
              </div>
              {dim.assessment && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {dim.assessment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {fit.scoredAt && (
        <p className="text-xs text-neutral-400 mt-3">
          Scored {formatDate(fit.scoredAt)}
        </p>
      )}
    </div>
  );
}

// ─── Generate Profile Button ────────────────────────────────

function GenerateProfileButton({ company }: { company: Company }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    setStatus("loading");
    setStatusMessage(`Researching ${company.name}...`);
    setErrorDetail("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.functions.invoke(
        "research-company",
        {
          body: { ticker: company.ticker },
        }
      );

      if (error) {
        throw new Error(error.message || "Edge function invocation failed");
      }

      if (data?.error) {
        throw new Error(data.details || data.error);
      }

      setStatusMessage("Profile generated! Reloading...");

      // Small delay so the user sees the success message
      await new Promise((r) => setTimeout(r, 800));
      router.refresh();
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setErrorDetail(msg);
      setStatusMessage("Failed to generate profile");
    }
  };

  if (status === "loading") {
    return (
      <div className="border border-neutral-200 rounded-lg p-10 text-center">
        <div className="inline-block h-5 w-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-neutral-700">{statusMessage}</p>
        <p className="text-xs text-neutral-400 mt-1">
          This usually takes 15–30 seconds
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-dashed border-red-200 rounded-lg p-10 text-center">
        <p className="text-neutral-600 font-medium mb-1">{statusMessage}</p>
        {errorDetail && (
          <p className="text-xs text-red-400 mb-4 max-w-md mx-auto">
            {errorDetail}
          </p>
        )}
        <button
          onClick={handleGenerate}
          className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="border border-dashed border-neutral-300 rounded-lg p-10 text-center">
      <p className="text-neutral-600 font-medium mb-1">
        Profile not yet available
      </p>
      <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed mb-5">
        Generate an AI-powered qualitative research profile for{" "}
        {company.name}. This will research the company using current web
        sources and produce a 7-section analysis.
      </p>
      <button
        onClick={handleGenerate}
        className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        Generate Profile
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function CompanyProfileClient({
  company,
  profile,
  profileGeneratedAt,
  sectors,
  isAuthenticated,
  isOnWatchlist,
  playbookFit,
}: CompanyProfileClientProps) {
  const sources = profile?.sources_consulted as
    | Array<{ url: string; title: string }>
    | undefined;

  return (
    <div className="p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/companies"
        className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-4 inline-block"
      >
        ← Companies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-mono text-neutral-400">
              {company.ticker}
            </span>
            {company.exchange && (
              <span className="text-xs text-neutral-400">
                {company.exchange}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {company.name}
          </h1>
        </div>

        <div className="shrink-0">
          <WatchlistButton
            companyId={company.id}
            initialOnWatchlist={isOnWatchlist}
            isAuthenticated={isAuthenticated}
            playbookId={playbookFit?.playbookId}
          />
        </div>
      </div>

      {/* Company meta: market cap + sector chips */}
      {(company.sector || company.marketCap || sectors.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8 text-sm text-neutral-500">
          {company.marketCap && (
            <span>{formatMarketCap(company.marketCap)} market cap</span>
          )}
          {sectors.length > 0 ? (
            <div className="flex gap-1.5">
              {sectors.map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded"
                >
                  {s.name}
                </span>
              ))}
            </div>
          ) : (
            <>
              {company.sector && (
                <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                  {company.sector}
                </span>
              )}
              {company.subsector && (
                <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                  {company.subsector}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Playbook Fit (when navigated from a playbook) */}
      {playbookFit && <PlaybookFitSection fit={playbookFit} />}

      {/* Profile content or empty state with generate button */}
      {profile ? (
        <div>
          {/* Profile sections */}
          <div className="divide-y divide-neutral-100">
            {sectionMeta.map(({ key, label }) => {
              const sectionContent = profile[key];
              if (!sectionContent || typeof sectionContent !== "string")
                return null;
              return (
                <ProfileSection
                  key={key}
                  label={label}
                  content={sectionContent}
                />
              );
            })}
          </div>

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-medium text-neutral-400 mb-3">
                Sources consulted
              </h3>
              <div className="space-y-1.5">
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-neutral-500 hover:text-neutral-700 transition-colors truncate"
                  >
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Generation timestamp */}
          {profileGeneratedAt && (
            <p className="text-xs text-neutral-400 mt-6">
              Profile generated {formatDate(profileGeneratedAt)}
            </p>
          )}
        </div>
      ) : (
        <GenerateProfileButton company={company} />
      )}

      {/* CTA */}
      <div className="mt-8 pt-8 border-t border-neutral-100">
        <Link
          href="/playbooks/new"
          className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Build a Playbook featuring {company.ticker} →
        </Link>
      </div>
    </div>
  );
}
