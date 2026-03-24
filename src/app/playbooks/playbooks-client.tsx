"use client";

import Link from "next/link";

interface Playbook {
  id: string;
  title: string;
  status: string;
  input_mode: string;
  raw_input: string | null;
  structured_criteria: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  match_count: number;
}

interface PlaybooksClientProps {
  playbooks: Playbook[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-600",
  },
  active: {
    label: "Active",
    className: "bg-amber-50 text-amber-700",
  },
  sourcing: {
    label: "Sourcing",
    className: "bg-blue-50 text-blue-700",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-50 text-emerald-700",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getThesisSummary(playbook: Playbook): string | null {
  // Try structured_criteria.thesis_summary first, then raw_input truncated
  const criteria = playbook.structured_criteria;
  if (criteria && typeof criteria.thesis_summary === "string") {
    return criteria.thesis_summary;
  }
  if (playbook.raw_input) {
    return playbook.raw_input.length > 120
      ? playbook.raw_input.slice(0, 120) + "…"
      : playbook.raw_input;
  }
  return null;
}

function getCriteriaChips(playbook: Playbook): string[] {
  const chips: string[] = [];
  const criteria = playbook.structured_criteria;
  if (!criteria) return chips;

  if (Array.isArray(criteria.themes)) {
    criteria.themes.slice(0, 2).forEach((t) => {
      if (typeof t === "string") chips.push(t);
    });
  }
  if (Array.isArray(criteria.sectors)) {
    criteria.sectors.slice(0, 2).forEach((s) => {
      if (typeof s === "string") chips.push(s);
    });
  }
  return [...new Set(chips)];
}

function PlaybookCard({ playbook }: { playbook: Playbook }) {
  const status = statusConfig[playbook.status] ?? statusConfig.draft;
  const summary = getThesisSummary(playbook);
  const chips = getCriteriaChips(playbook);

  return (
    <Link
      href={`/playbooks/${playbook.id}`}
      className="block border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 line-clamp-1">
          {playbook.title}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
          {summary}
        </p>
      )}

      {/* Criteria chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span>{formatDate(playbook.created_at)}</span>
        <span>·</span>
        <span>{playbook.input_mode === "guided" ? "Guided" : "Free-text"}</span>
        {playbook.match_count > 0 && (
          <>
            <span>·</span>
            <span>
              {playbook.match_count} {playbook.match_count === 1 ? "match" : "matches"}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

export function PlaybooksClient({ playbooks }: PlaybooksClientProps) {
  const hasPlaybooks = playbooks.length > 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">My Playbooks</h1>
          <p className="text-sm text-neutral-500">
            Your investment playbooks and matched companies.
          </p>
        </div>
        <Link
          href="/playbooks/new"
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          New Playbook
        </Link>
      </div>

      {/* Playbook list or empty state */}
      {hasPlaybooks ? (
        <div className="space-y-3">
          {playbooks.map((p) => (
            <PlaybookCard key={p.id} playbook={p} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-lg p-12 text-center">
          <p className="text-neutral-900 font-medium mb-1.5">No playbooks yet</p>
          <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto leading-relaxed">
            Create your first playbook to start discovering companies
            that match your investment thesis.
          </p>
          <Link
            href="/playbooks/new"
            className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            New Playbook
          </Link>
        </div>
      )}
    </div>
  );
}
