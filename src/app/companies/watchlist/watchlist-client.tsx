"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────

interface WatchlistNote {
  id: string;
  content: string;
  createdAt: string;
}

interface WatchlistCompany {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  marketCap: number | null;
  exchange: string | null;
  hasProfile: boolean;
  excerpt: string | null;
  profileGeneratedAt: string | null;
}

interface WatchlistItem {
  id: string;
  priority: string;
  createdAt: string;
  company: WatchlistCompany | null;
  playbook: { id: string; title: string } | null;
  notes: WatchlistNote[];
}

interface PlaybookOption {
  id: string;
  title: string;
}

interface WatchlistClientProps {
  items: WatchlistItem[];
  playbooks: PlaybookOption[];
}

// ─── Helpers ────────────────────────────────────────────────

function formatMarketCap(cap: number | null): string {
  if (!cap) return "—";
  if (cap >= 1_000_000_000_000)
    return `$${(cap / 1_000_000_000_000).toFixed(1)}T`;
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(0)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const priorityOrder: Record<string, number> = {
  high: 0,
  monitoring: 1,
  exploring: 2,
};

const priorityConfig: Record<
  string,
  { label: string; tagClass: string; borderClass: string }
> = {
  high: {
    label: "High conviction",
    tagClass: "bg-emerald-50 text-emerald-700",
    borderClass: "border-l-emerald-500",
  },
  monitoring: {
    label: "Monitoring",
    tagClass: "bg-blue-50 text-blue-700",
    borderClass: "border-l-blue-400",
  },
  exploring: {
    label: "Exploring",
    tagClass: "bg-neutral-100 text-neutral-500",
    borderClass: "border-l-neutral-200",
  },
};

// ─── Inline Note Input ──────────────────────────────────────

function AddNoteInput({
  companyId,
  onSaved,
}: {
  companyId: string;
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("usr_notes")
      .insert({ company_id: companyId, content: content.trim() });
    setContent("");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="flex gap-2 items-start mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a quick note..."
        rows={1}
        className="flex-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors resize-none bg-white"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
      />
      <button
        onClick={handleSave}
        disabled={!content.trim() || saving}
        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
      >
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}

// ─── Conviction Picker ──────────────────────────────────────

function ConvictionPicker({
  watchlistItemId,
  currentPriority,
  onChanged,
}: {
  watchlistItemId: string;
  currentPriority: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleSelect = async (priority: string) => {
    if (priority === currentPriority) {
      setOpen(false);
      return;
    }
    setUpdating(true);
    const supabase = createClient();
    await supabase
      .from("usr_watchlist_items")
      .update({ priority })
      .eq("id", watchlistItemId);
    setUpdating(false);
    setOpen(false);
    onChanged();
  };

  const config = priorityConfig[currentPriority] ?? priorityConfig.exploring;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        disabled={updating}
        className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-opacity ${config.tagClass} ${
          updating ? "opacity-50" : ""
        }`}
      >
        {config.label}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-sm z-10 py-1 min-w-[140px]">
          {Object.entries(priorityConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(key);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 transition-colors flex items-center gap-2 ${
                key === currentPriority
                  ? "text-neutral-900 font-medium"
                  : "text-neutral-600"
              }`}
            >
              <span
                className={`w-2 h-0.5 rounded-full ${
                  key === "high"
                    ? "bg-emerald-500"
                    : key === "monitoring"
                    ? "bg-blue-400"
                    : "bg-neutral-300"
                }`}
              />
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Watchlist Card ─────────────────────────────────────────

function WatchlistCard({
  item,
  onRefresh,
}: {
  item: WatchlistItem;
  onRefresh: () => void;
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();

  if (!item.company) return null;

  const co = item.company;
  const config = priorityConfig[item.priority] ?? priorityConfig.exploring;

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRemoving(true);
    const supabase = createClient();
    await supabase
      .from("usr_watchlist_items")
      .delete()
      .eq("id", item.id);
    onRefresh();
  };

  return (
    <div
      className={`border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors border-l-[3px] ${config.borderClass}`}
    >
      {/* Top row: ticker, name, conviction, score, remove */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link
          href={`/companies/${co.ticker}`}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <span className="text-xs font-mono text-neutral-400 shrink-0">
            {co.ticker}
          </span>
          <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors truncate">
            {co.name}
          </span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <ConvictionPicker
            watchlistItemId={item.id}
            currentPriority={item.priority}
            onChanged={onRefresh}
          />
          {item.playbook && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-violet-50 text-violet-700 hidden sm:inline">
              {item.playbook.title}
            </span>
          )}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-[11px] px-2 py-0.5 border border-transparent rounded text-neutral-400 hover:border-neutral-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            style={{ opacity: undefined }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            {removing ? "..." : "Remove"}
          </button>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {co.sector && (
          <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded">
            {co.subsector ?? co.sector}
          </span>
        )}
        {co.hasProfile ? (
          <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
            Profiled
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-400 rounded">
            Awaiting profile
          </span>
        )}
        {co.marketCap && (
          <span className="text-[11px] text-neutral-400">
            {formatMarketCap(co.marketCap)}
          </span>
        )}
      </div>

      {/* Profile excerpt */}
      {co.excerpt && (
        <p className="text-[13px] text-neutral-500 leading-relaxed mb-2 line-clamp-1">
          {co.excerpt}
        </p>
      )}

      {/* Inline notes */}
      {(item.notes.length > 0 || showNoteInput) && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-400"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {item.notes.length} {item.notes.length === 1 ? "note" : "notes"}
            </span>
            {!showNoteInput && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNoteInput(true);
                }}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Add note
              </button>
            )}
          </div>
          {item.notes.slice(0, 3).map((note) => (
            <div key={note.id} className="flex gap-2 py-1">
              <span className="w-1 h-1 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
              <span className="text-xs text-neutral-500 leading-relaxed flex-1">
                {note.content}
              </span>
              <span className="text-[11px] text-neutral-400 shrink-0">
                {timeAgo(note.createdAt)}
              </span>
            </div>
          ))}
          {item.notes.length > 3 && (
            <Link
              href={`/research/notes?company=${co.ticker}`}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors mt-1 inline-block"
            >
              View all {item.notes.length} notes →
            </Link>
          )}
          {showNoteInput && (
            <AddNoteInput
              companyId={co.id}
              onSaved={() => {
                setShowNoteInput(false);
                onRefresh();
              }}
            />
          )}
        </div>
      )}

      {/* Footer: date + actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <span className="text-[11px] text-neutral-400">
          Added {timeAgo(item.createdAt)}
        </span>
        <div className="flex items-center gap-1.5">
          {item.notes.length === 0 && !showNoteInput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNoteInput(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Add note
            </button>
          )}
          {item.notes.length === 0 && !showNoteInput && (
            <span className="text-neutral-200 text-xs">·</span>
          )}
          {co.hasProfile ? (
            <Link
              href={`/companies/${co.ticker}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View profile
            </Link>
          ) : (
            <Link
              href={`/companies/${co.ticker}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Generate profile
            </Link>
          )}
          {!item.playbook && (
            <>
              <span className="text-neutral-200 text-xs">·</span>
              <span className="text-xs text-blue-600 font-medium">
                Link to playbook
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────

function EmptyWatchlist() {
  return (
    <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
      <div className="flex justify-center mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-neutral-300"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-neutral-600 font-medium mb-1">
        Your watchlist is empty
      </p>
      <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed mb-5">
        Save companies from profiles or playbook matches to start building your
        research pipeline. Tag conviction levels and capture notes as you go.
      </p>
      <Link
        href="/companies"
        className="inline-flex px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        Browse companies
      </Link>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

type GroupBy = "playbook" | "conviction" | "sector" | "none";
type SortBy =
  | "conviction-desc"
  | "added-desc"
  | "name-asc"
  | "cap-desc";

export function WatchlistClient({ items, playbooks }: WatchlistClientProps) {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>("playbook");
  const [sortBy, setSortBy] = useState<SortBy>("conviction-desc");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Sort items
  const sorted = useMemo(() => {
    const list = [...items];
    switch (sortBy) {
      case "conviction-desc":
        list.sort(
          (a, b) =>
            (priorityOrder[a.priority] ?? 2) -
            (priorityOrder[b.priority] ?? 2)
        );
        break;
      case "added-desc":
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "name-asc":
        list.sort((a, b) =>
          (a.company?.name ?? "").localeCompare(b.company?.name ?? "")
        );
        break;
      case "cap-desc":
        list.sort(
          (a, b) =>
            (b.company?.marketCap ?? 0) - (a.company?.marketCap ?? 0)
        );
        break;
    }
    return list;
  }, [items, sortBy]);

  // Group items
  const groups = useMemo(() => {
    const result: Array<{ label: string; items: WatchlistItem[] }> = [];

    if (groupBy === "none") {
      return [{ label: "", items: sorted }];
    }

    const map = new Map<string, WatchlistItem[]>();

    for (const item of sorted) {
      let key = "";
      switch (groupBy) {
        case "playbook":
          key = item.playbook?.title ?? "No playbook";
          break;
        case "conviction":
          key =
            priorityConfig[item.priority]?.label ?? "Exploring";
          break;
        case "sector":
          key = item.company?.sector ?? "No sector";
          break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    // Sort groups: for conviction, use priority order; otherwise alphabetical with "No X" last
    const entries = Array.from(map.entries());
    if (groupBy === "conviction") {
      const order = ["High conviction", "Monitoring", "Exploring"];
      entries.sort(
        (a, b) =>
          (order.indexOf(a[0]) === -1 ? 99 : order.indexOf(a[0])) -
          (order.indexOf(b[0]) === -1 ? 99 : order.indexOf(b[0]))
      );
    } else {
      entries.sort((a, b) => {
        if (a[0].startsWith("No ")) return 1;
        if (b[0].startsWith("No ")) return -1;
        return a[0].localeCompare(b[0]);
      });
    }

    for (const [label, groupItems] of entries) {
      result.push({ label, items: groupItems });
    }

    return result;
  }, [sorted, groupBy]);

  // Stats
  const totalNotes = items.reduce((sum, i) => sum + i.notes.length, 0);
  const companiesWithNotes = new Set(
    items.filter((i) => i.notes.length > 0).map((i) => i.company?.id)
  ).size;
  const profiledCount = items.filter(
    (i) => i.company?.hasProfile
  ).length;
  const highCount = items.filter((i) => i.priority === "high").length;
  const monitoringCount = items.filter(
    (i) => i.priority === "monitoring"
  ).length;
  const exploringCount = items.filter(
    (i) => i.priority === "exploring"
  ).length;

  if (items.length === 0) {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Watchlist
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          Your research staging area. Track companies, tag conviction, and
          capture notes as you go.
        </p>
        <EmptyWatchlist />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
        Watchlist
      </h1>
      <p className="text-sm text-neutral-500 leading-relaxed mb-6">
        Your research staging area. Track companies, tag conviction, and capture
        notes as you go.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="bg-neutral-50 rounded-lg p-3.5">
          <p className="text-xs text-neutral-400 mb-1">Watching</p>
          <p className="text-xl font-medium text-neutral-900">
            {items.length}
          </p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3.5">
          <p className="text-xs text-neutral-400 mb-1">Conviction</p>
          <p className="text-xl font-medium text-neutral-900">
            {highCount} / {monitoringCount} / {exploringCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            High · Monitoring · Exploring
          </p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3.5">
          <p className="text-xs text-neutral-400 mb-1">Profiled</p>
          <p className="text-xl font-medium text-neutral-900">
            {profiledCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            of {items.length} tracked
          </p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3.5">
          <p className="text-xs text-neutral-400 mb-1">Research notes</p>
          <p className="text-xl font-medium text-neutral-900">{totalNotes}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            across {companiesWithNotes}{" "}
            {companiesWithNotes === 1 ? "company" : "companies"}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-5 px-3 py-2.5 bg-neutral-50 rounded-lg">
        <span className="text-xs text-neutral-400 font-medium">
          Conviction:
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-0.5 rounded-full bg-emerald-500" />
          High conviction
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-0.5 rounded-full bg-blue-400" />
          Monitoring
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-0.5 rounded-full bg-neutral-300" />
          Exploring
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 transition-colors"
        >
          <option value="playbook">Group by playbook</option>
          <option value="conviction">Group by conviction</option>
          <option value="sector">Group by sector</option>
          <option value="none">No grouping</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 transition-colors"
        >
          <option value="conviction-desc">Conviction: high first</option>
          <option value="added-desc">Recently added</option>
          <option value="name-asc">Name: A → Z</option>
          <option value="cap-desc">Market cap: high → low</option>
        </select>
        <span className="text-xs text-neutral-400 ml-auto">
          {items.length} {items.length === 1 ? "company" : "companies"}
        </span>
      </div>

      {/* Card list with groups */}
      <div>
        {groups.map((group) => (
          <div key={group.label || "__ungrouped"} className="mb-5">
            {group.label && (
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-1.5 mb-2 border-b border-neutral-100">
                {group.label}
                <span className="text-neutral-300 ml-2 font-normal normal-case tracking-normal">
                  {group.items.length}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <WatchlistCard
                  key={item.id}
                  item={item}
                  onRefresh={refresh}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
