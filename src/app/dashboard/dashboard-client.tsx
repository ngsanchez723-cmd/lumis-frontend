"use client";

import Link from "next/link";

interface Playbook {
  id: string;
  title: string;
  status: string;
  input_mode: string;
  created_at: string;
  updated_at: string;
  match_count: number;
}

interface DashboardClientProps {
  displayName: string;
  tier: string;
  playbooks: Playbook[];
  totalMatches: number;
  watchlistCount: number;
  notesCount: number;
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
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="border border-neutral-200 rounded-lg p-5">
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:border-neutral-400 transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}

function PlaybookRow({ playbook }: { playbook: Playbook }) {
  const status = statusConfig[playbook.status] ?? statusConfig.draft;

  return (
    <Link
      href={`/playbooks/${playbook.id}`}
      className="flex items-center justify-between py-3.5 px-4 -mx-4 rounded-lg hover:bg-neutral-50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-700">
          {playbook.title}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {formatDate(playbook.created_at)}
          {playbook.input_mode === "guided" ? " · Guided" : " · Free-text"}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {playbook.match_count > 0 && (
          <span className="text-xs text-neutral-500">
            {playbook.match_count} {playbook.match_count === 1 ? "match" : "matches"}
          </span>
        )}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </Link>
  );
}

export function DashboardClient({
  displayName,
  playbooks,
  totalMatches,
  watchlistCount,
  notesCount,
}: DashboardClientProps) {
  const firstName = displayName?.split(" ")[0] || "";
  const hasPlaybooks = playbooks.length > 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Your research home base.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Playbooks" value={playbooks.length} href="/playbooks" />
        <StatCard label="Companies matched" value={totalMatches} />
        <StatCard label="Watchlist" value={watchlistCount} href="/companies/watchlist" />
        <StatCard label="Research notes" value={notesCount} href="/research/notes" />
      </div>

      {/* Recent Playbooks or Onboarding */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-neutral-900">
            {hasPlaybooks ? "Recent Playbooks" : "Get started"}
          </h2>
          {hasPlaybooks && (
            <Link
              href="/playbooks/new"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              New Playbook →
            </Link>
          )}
        </div>

        {hasPlaybooks ? (
          <div className="divide-y divide-neutral-100">
            {playbooks.slice(0, 5).map((p) => (
              <PlaybookRow key={p.id} playbook={p} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-neutral-300 rounded-lg p-10 text-center">
            <p className="text-neutral-900 font-medium mb-1.5">
              Create your first playbook
            </p>
            <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto leading-relaxed">
              Describe an investment thesis — a sector trend, a market conviction,
              a type of company you believe in — and Lumis will find matching
              public companies and score them against your criteria.
            </p>
            <Link
              href="/playbooks/new"
              className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              New Playbook
            </Link>
          </div>
        )}

        {/* View all link when there are more than 5 */}
        {playbooks.length > 5 && (
          <div className="mt-3 text-center">
            <Link
              href="/playbooks"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              View all {playbooks.length} playbooks →
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions when user has playbooks */}
      {hasPlaybooks && (
        <div className="mt-8 pt-8 border-t border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900 mb-3">
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/playbooks/new"
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
            >
              New Playbook
            </Link>
            <Link
              href="/discover/themes"
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Browse Themes
            </Link>
            <Link
              href="/discover/sectors"
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Explore Sectors
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
