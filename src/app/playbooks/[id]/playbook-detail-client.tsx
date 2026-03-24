"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

// ─── Types ──────────────────────────────────────────────────

interface Playbook {
  id: string;
  title: string;
  status: string;
  input_mode: string;
  raw_input: string | null;
  structured_criteria: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DimensionScore {
  score: number;
  assessment: string;
}

interface CompanyMatch {
  id: string;
  fit_score: number | null;
  score_rationale: string | null;
  dimension_scores: Record<string, unknown> | null;
  scored_at: string | null;
  company: {
    id: string;
    ticker: string;
    name: string;
    sector: string | null;
  } | null;
}

interface PlaybookDetailClientProps {
  playbook: Playbook;
  matches: CompanyMatch[];
  guidedResponses: Record<string, unknown> | null;
}

// ─── Constants ──────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-600",
    description: "Thesis submitted — awaiting AI parsing.",
  },
  active: {
    label: "Active",
    className: "bg-amber-50 text-amber-700",
    description: "Criteria extracted — ready to source companies.",
  },
  sourcing: {
    label: "Sourcing",
    className: "bg-blue-50 text-blue-700",
    description: "AI is finding and researching matching companies.",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-50 text-emerald-700",
    description: "Companies matched and scored.",
  },
};

const dimensionLabels: Record<string, string> = {
  competitive_moat: "Competitive moat",
  revenue_growth: "Revenue growth",
  innovation: "Innovation",
  market_timing: "Market timing",
  management_quality: "Management quality",
  management: "Management quality",
  valuation: "Valuation",
  regulatory_risk: "Regulatory risk",
  brand_strength: "Brand strength",
  sector_momentum: "Sector momentum",
  partnerships: "Partnerships",
  balance_sheet_health: "Balance sheet health",
};

// Ordered list of core dimensions for consistent display
const coreDimensionOrder = [
  "competitive_moat",
  "revenue_growth",
  "innovation",
  "market_timing",
  "management_quality",
  "management",
];

type SortOption = "score-desc" | "score-asc" | "name-asc" | "name-desc";

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getScoreColor(score: number): {
  badge: string;
  bar: string;
  text: string;
} {
  if (score >= 80)
    return {
      badge: "bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-400",
      text: "text-emerald-700",
    };
  if (score >= 60)
    return {
      badge: "bg-amber-50 text-amber-700",
      bar: "bg-amber-400",
      text: "text-amber-700",
    };
  return {
    badge: "bg-neutral-100 text-neutral-600",
    bar: "bg-neutral-300",
    text: "text-neutral-600",
  };
}

function parseDimensionScores(
  raw: Record<string, unknown> | null
): Array<{ key: string; label: string; score: number; assessment: string }> {
  if (!raw) return [];

  const results: Array<{
    key: string;
    label: string;
    score: number;
    assessment: string;
  }> = [];

  // First pass: add dimensions in the canonical order
  for (const key of coreDimensionOrder) {
    const dim = raw[key] as DimensionScore | undefined;
    if (dim && typeof dim.score === "number") {
      results.push({
        key,
        label: dimensionLabels[key] ?? key.replace(/_/g, " "),
        score: dim.score,
        assessment: dim.assessment ?? "",
      });
    }
  }

  // Second pass: add any extended dimensions not in core order
  for (const [key, val] of Object.entries(raw)) {
    if (coreDimensionOrder.includes(key)) continue;
    const dim = val as DimensionScore | undefined;
    if (dim && typeof dim.score === "number") {
      results.push({
        key,
        label: dimensionLabels[key] ?? key.replace(/_/g, " "),
        score: dim.score,
        assessment: dim.assessment ?? "",
      });
    }
  }

  return results;
}

// ─── Score Badge ────────────────────────────────────────────

function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const color = getScoreColor(score);
  const sizeClass =
    size === "lg"
      ? "text-lg font-bold px-3.5 py-1.5 rounded-xl"
      : size === "sm"
      ? "text-xs font-semibold px-2 py-0.5 rounded-md"
      : "text-sm font-semibold px-2.5 py-1 rounded-lg";

  return <span className={`${sizeClass} ${color.badge}`}>{score}</span>;
}

// ─── Dimension Bar ──────────────────────────────────────────

function DimensionBar({
  label,
  score,
  assessment,
  showAssessment = true,
}: {
  label: string;
  score: number;
  assessment: string;
  showAssessment?: boolean;
}) {
  const color = getScoreColor(score);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-neutral-700">{label}</span>
        <span className={`text-[13px] font-medium ${color.text}`}>{score}</span>
      </div>
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showAssessment && assessment && (
        <p className="text-xs text-neutral-500 leading-relaxed mt-1.5">
          {assessment}
        </p>
      )}
    </div>
  );
}

// ─── Delete Playbook Button ─────────────────────────────────

function DeletePlaybookButton({ playbookId }: { playbookId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("usr_theses")
      .delete()
      .eq("id", playbookId);

    if (error) {
      setDeleting(false);
      setConfirming(false);
      return;
    }

    router.push("/playbooks");
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500">Delete this playbook?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs px-3 py-1.5 border border-neutral-200 text-neutral-500 rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
    >
      Delete
    </button>
  );
}

// ─── Expandable Match Card ──────────────────────────────────

function ExpandableMatchCard({
  match,
  isExpanded,
  onToggle,
  isCompareMode,
  isSelected,
  onSelectToggle,
  playbookId,
}: {
  match: CompanyMatch;
  isExpanded: boolean;
  onToggle: () => void;
  isCompareMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  playbookId: string;
}) {
  if (!match.company) return null;

  const dimensions = parseDimensionScores(match.dimension_scores);
  const hasScores = match.fit_score !== null;

  return (
    <div
      className={`border rounded-xl transition-colors ${
        isExpanded
          ? "border-neutral-300 bg-white"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      {/* Header — always visible, clickable to expand */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        {/* Compare checkbox */}
        {isCompareMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle();
            }}
            className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
              isSelected
                ? "bg-neutral-900 border-neutral-900"
                : "border-neutral-300 hover:border-neutral-400"
            }`}
          >
            {isSelected && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        )}

        {/* Company info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">
              {match.company.ticker}
            </span>
            <span className="text-sm font-medium text-neutral-900 truncate">
              {match.company.name}
            </span>
            {match.company.sector && !isExpanded && (
              <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded hidden sm:inline">
                {match.company.sector}
              </span>
            )}
          </div>
          {!isExpanded && match.score_rationale && (
            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
              {match.score_rationale}
            </p>
          )}
        </div>

        {/* Score badge */}
        {hasScores && (
          <div className="shrink-0 flex items-center gap-2">
            <ScoreBadge score={match.fit_score!} />
          </div>
        )}

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-neutral-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Rationale */}
          {match.score_rationale && (
            <p className="text-sm text-neutral-600 leading-relaxed mb-4">
              {match.score_rationale}
            </p>
          )}

          {/* Dimension scores */}
          {dimensions.length > 0 && (
            <div className="border-t border-neutral-100 pt-4 mb-4">
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Per-dimension scores
              </p>
              {dimensions.map((dim) => (
                <DimensionBar
                  key={dim.key}
                  label={dim.label}
                  score={dim.score}
                  assessment={dim.assessment}
                />
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <Link
                href={`/companies/${match.company.ticker}?from_playbook=${playbookId}`}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                View full profile →
              </Link>
            </div>
            {match.scored_at && (
              <span className="text-[11px] text-neutral-400">
                Scored {formatDate(match.scored_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Compare View ───────────────────────────────────────────

function CompareView({
  matches,
}: {
  matches: CompanyMatch[];
}) {
  // Collect all dimension keys across selected matches
  const allDimensions = useMemo(() => {
    const keySet = new Set<string>();
    for (const m of matches) {
      const dims = parseDimensionScores(m.dimension_scores);
      for (const d of dims) keySet.add(d.key);
    }
    // Return in canonical order
    const ordered: string[] = [];
    for (const key of coreDimensionOrder) {
      if (keySet.has(key)) ordered.push(key);
    }
    // Add any extras
    for (const key of keySet) {
      if (!ordered.includes(key)) ordered.push(key);
    }
    return ordered;
  }, [matches]);

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50/50 border-b border-neutral-100">
            <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-3 w-[160px]">
              Dimension
            </th>
            {matches.map((m) => (
              <th
                key={m.id}
                className="text-center px-4 py-3 border-l border-neutral-100"
              >
                <span className="text-xs font-mono text-neutral-500">
                  {m.company?.ticker}
                </span>
                {m.fit_score !== null && (
                  <span className="block text-[11px] text-neutral-400 mt-0.5">
                    Fit: {m.fit_score}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allDimensions.map((dimKey) => (
            <tr
              key={dimKey}
              className="border-t border-neutral-100 hover:bg-neutral-50/50 transition-colors"
            >
              <td className="px-4 py-2.5 text-[13px] text-neutral-700">
                {dimensionLabels[dimKey] ?? dimKey.replace(/_/g, " ")}
              </td>
              {matches.map((m) => {
                const dims = m.dimension_scores as Record<
                  string,
                  DimensionScore
                > | null;
                const dim = dims?.[dimKey];
                const score = dim?.score;

                return (
                  <td
                    key={m.id}
                    className="px-4 py-2.5 text-center border-l border-neutral-100"
                  >
                    {score != null ? (
                      <ScoreBadge score={score} size="sm" />
                    ) : (
                      <span className="text-xs text-neutral-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Criteria Section ───────────────────────────────────────

function CriteriaSection({
  playbook,
}: {
  playbook: Playbook;
  guidedResponses: Record<string, unknown> | null;
}) {
  const criteria = playbook.structured_criteria;

  const themes: string[] = [];
  const sectors: string[] = [];
  let growth = "";
  let geography = "";
  let profitability = "";
  const sizes: string[] = [];

  if (criteria) {
    if (Array.isArray(criteria.themes))
      themes.push(
        ...criteria.themes.filter((t): t is string => typeof t === "string")
      );
    if (Array.isArray(criteria.sectors))
      sectors.push(
        ...criteria.sectors.filter((s): s is string => typeof s === "string")
      );
    const chars = criteria.company_characteristics as
      | Record<string, unknown>
      | undefined;
    if (chars) {
      if (typeof chars.growth_preference === "string")
        growth = chars.growth_preference;
      if (typeof chars.geographic_focus === "string")
        geography = chars.geographic_focus;
      if (typeof chars.profitability === "string")
        profitability = chars.profitability;
      if (Array.isArray(chars.size_preference))
        sizes.push(
          ...chars.size_preference.filter(
            (s): s is string => typeof s === "string"
          )
        );
    }
  }

  const hasAnyCriteria =
    themes.length > 0 ||
    sectors.length > 0 ||
    growth ||
    geography ||
    profitability ||
    sizes.length > 0;

  if (!hasAnyCriteria && !playbook.raw_input) return null;

  const labelMap: Record<string, string> = {
    high_growth: "High growth",
    moderate_growth: "Moderate growth",
    stable: "Stable / value",
    flexible: "No preference",
    us: "United States",
    north_america: "North America",
    europe: "Europe",
    asia: "Asia-Pacific",
    global: "Global",
    profitable: "Profitable now",
    path_to_profit: "Path to profitability",
    pre_revenue: "Pre-revenue",
    large_cap: "Large cap",
    mid_cap: "Mid cap",
    small_cap: "Small cap",
    micro_cap: "Micro cap",
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-neutral-900 mb-3">Criteria</h2>

      {playbook.input_mode === "free_text" && playbook.raw_input && (
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
          {playbook.raw_input}
        </p>
      )}

      {hasAnyCriteria && (
        <div className="space-y-3">
          {themes.length > 0 && (
            <div>
              <span className="text-xs text-neutral-400">Themes</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {themes.map((t, i) => (
                  <span
                    key={`theme-${i}`}
                    className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sectors.length > 0 && (
            <div>
              <span className="text-xs text-neutral-400">Sectors</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {sectors.map((s, i) => (
                  <span
                    key={`sector-${i}`}
                    className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {growth && growth !== "flexible" && (
              <div>
                <span className="text-xs text-neutral-400">Growth</span>
                <p className="text-sm text-neutral-700">
                  {labelMap[growth] ?? growth}
                </p>
              </div>
            )}
            {sizes.length > 0 && !sizes.includes("flexible") && (
              <div>
                <span className="text-xs text-neutral-400">Size</span>
                <p className="text-sm text-neutral-700">
                  {sizes.map((s) => labelMap[s] ?? s).join(", ")}
                </p>
              </div>
            )}
            {geography && geography !== "global" && (
              <div>
                <span className="text-xs text-neutral-400">Geography</span>
                <p className="text-sm text-neutral-700">
                  {labelMap[geography] ?? geography}
                </p>
              </div>
            )}
            {profitability && profitability !== "flexible" && (
              <div>
                <span className="text-xs text-neutral-400">Profitability</span>
                <p className="text-sm text-neutral-700">
                  {labelMap[profitability] ?? profitability}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function PlaybookDetailClient({
  playbook,
  matches,
  guidedResponses,
}: PlaybookDetailClientProps) {
  const status = statusConfig[playbook.status] ?? statusConfig.draft;
  const hasMatches = matches.length > 0;
  const scoredMatches = matches.filter((m) => m.fit_score !== null);

  // UI state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("score-desc");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort matches
  const sortedMatches = useMemo(() => {
    const list = [...matches];
    switch (sortBy) {
      case "score-desc":
        list.sort((a, b) => (b.fit_score ?? -1) - (a.fit_score ?? -1));
        break;
      case "score-asc":
        list.sort((a, b) => (a.fit_score ?? 999) - (b.fit_score ?? 999));
        break;
      case "name-asc":
        list.sort((a, b) =>
          (a.company?.name ?? "").localeCompare(b.company?.name ?? "")
        );
        break;
      case "name-desc":
        list.sort((a, b) =>
          (b.company?.name ?? "").localeCompare(a.company?.name ?? "")
        );
        break;
    }
    return list;
  }, [matches, sortBy]);

  // Compare selection
  const selectedMatches = useMemo(
    () => sortedMatches.filter((m) => selectedIds.has(m.id)),
    [sortedMatches, selectedIds]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompareToggle = () => {
    if (compareMode) {
      setCompareMode(false);
      setSelectedIds(new Set());
    } else {
      setCompareMode(true);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/playbooks"
        className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-4 inline-block"
      >
        ← My Playbooks
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {playbook.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
            <DeletePlaybookButton playbookId={playbook.id} />
          </div>
        </div>
        <p className="text-sm text-neutral-500">
          Created {formatDate(playbook.created_at)}
          {playbook.input_mode === "guided"
            ? " · Guided mode"
            : " · Free-text mode"}
        </p>
      </div>

      {/* Status message */}
      {playbook.status !== "complete" && (
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-neutral-600">{status.description}</p>
          {playbook.status === "draft" && (
            <p className="text-xs text-neutral-400 mt-1">
              The pipeline will process this playbook once edge functions are
              deployed.
            </p>
          )}
          {playbook.status === "active" && (
            <p className="text-xs text-neutral-400 mt-1">
              Company sourcing will begin once the pipeline is connected.
            </p>
          )}
        </div>
      )}

      {/* Criteria */}
      <CriteriaSection
        playbook={playbook}
        guidedResponses={guidedResponses}
      />

      {/* Matched Companies */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-neutral-900">
            Matched Companies
            {scoredMatches.length > 0 && (
              <span className="text-sm font-normal text-neutral-400 ml-2">
                {scoredMatches.length} scored
              </span>
            )}
          </h2>
        </div>

        {/* Sort + compare controls */}
        {hasMatches && scoredMatches.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            {/* Sort pills */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400 mr-1">Sort</span>
              {(
                [
                  { key: "score-desc", label: "Score ↓" },
                  { key: "score-asc", label: "Score ↑" },
                  { key: "name-asc", label: "A → Z" },
                ] as Array<{ key: SortOption; label: string }>
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    sortBy === opt.key
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Compare toggle */}
            {matches.length >= 2 && (
              <button
                onClick={handleCompareToggle}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  compareMode
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
                }`}
              >
                {compareMode ? "Exit compare" : "Compare"}
              </button>
            )}
          </div>
        )}

        {/* Compare selection hint */}
        {compareMode && selectedIds.size === 0 && (
          <p className="text-xs text-neutral-400 mb-3">
            Select 2–4 companies to compare side by side.
          </p>
        )}

        {/* Compare view */}
        {compareMode && selectedMatches.length >= 2 && (
          <CompareView matches={selectedMatches} />
        )}

        {/* Match cards */}
        {hasMatches ? (
          <div className="space-y-2">
            {sortedMatches.map((m) => (
              <ExpandableMatchCard
                key={m.id}
                match={m}
                isExpanded={expandedIds.has(m.id)}
                onToggle={() => toggleExpand(m.id)}
                isCompareMode={compareMode}
                isSelected={selectedIds.has(m.id)}
                onSelectToggle={() => toggleSelect(m.id)}
                playbookId={playbook.id}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-neutral-300 rounded-lg p-10 text-center">
            <p className="text-neutral-600 font-medium mb-1">
              No matches yet
            </p>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
              {playbook.status === "draft"
                ? "This playbook is waiting for the AI to parse your thesis into structured criteria."
                : playbook.status === "active"
                ? "Criteria are ready — company sourcing will begin once the pipeline is connected."
                : "Companies are being sourced and researched. This may take a few minutes."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
