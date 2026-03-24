"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

// ─── Types ──────────────────────────────────────────────────

interface SpotlightCompany {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  marketCap: number | null;
  exchange: string | null;
  excerpt: string;
  generatedAt: string | null;
}

interface SectorOption {
  id: string;
  name: string;
}

interface WatchlistCompany {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
}

interface CompaniesClientProps {
  isAuthenticated: boolean;
  totalCompanies: number;
  profiledCount: number;
  sectorCount: number;
  spotlightCompanies: SpotlightCompany[];
  sectors: SectorOption[];
  watchlistCompanies: WatchlistCompany[];
  playbookMatchCount: number;
  playbookCount: number;
}

interface BrowseCompany {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  marketCap: number | null;
  exchange: string | null;
  hasProfile: boolean;
}

interface SearchResult {
  id: string;
  ticker: string;
  name: string;
  exchange: string | null;
  marketCap: number | null;
  hasProfile: boolean;
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
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

const PAGE_SIZE = 25;

// ─── Search Dropdown ────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const pattern = `%${q}%`;

    const { data } = await supabase
      .from("core_companies")
      .select("id, ticker, name, exchange, market_cap, latest_profile_id")
      .or(`ticker.ilike.${pattern},name.ilike.${pattern}`)
      .order("market_cap", { ascending: false, nullsFirst: false })
      .limit(8);

    setResults(
      (data ?? []).map((c) => ({
        id: c.id as string,
        ticker: c.ticker as string,
        name: c.name as string,
        exchange: c.exchange as string | null,
        marketCap: c.market_cap as number | null,
        hasProfile: c.latest_profile_id !== null,
      }))
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query.trim()), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Search icon */}
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search by ticker or company name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full py-3.5 pl-11 pr-4 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white"
      />

      {/* Dropdown */}
      {isOpen && (query.length > 0 || true) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-sm max-h-80 overflow-y-auto z-20">
          {query.length === 0 && (
            <p className="px-4 py-3 text-sm text-neutral-400">
              Start typing to search across all companies...
            </p>
          )}
          {query.length > 0 && isLoading && (
            <p className="px-4 py-3 text-sm text-neutral-400">Searching...</p>
          )}
          {query.length > 0 && !isLoading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-neutral-400">
              No matches found
            </p>
          )}
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/companies/${r.ticker}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-neutral-400 w-14 shrink-0">
                  {r.ticker}
                </span>
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {r.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {r.hasProfile && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    Profiled
                  </span>
                )}
                <span className="text-xs font-mono text-neutral-400">
                  {formatMarketCap(r.marketCap)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Your Companies ─────────────────────────────────────────

function YourCompanies({
  watchlistCompanies,
  playbookMatchCount,
  playbookCount,
}: {
  watchlistCompanies: WatchlistCompany[];
  playbookMatchCount: number;
  playbookCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Watchlist */}
      <Link
        href="/companies/watchlist"
        className="bg-neutral-50 rounded-xl p-4 hover:bg-neutral-100 transition-colors group"
      >
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="text-neutral-400 group-hover:text-neutral-600 transition-colors"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-medium text-neutral-900">
            Watchlist
          </span>
        </div>
        {watchlistCompanies.length > 0 ? (
          <p className="text-xs text-neutral-500">
            {watchlistCompanies
              .slice(0, 3)
              .map((c) => c.ticker)
              .join(", ")}
            {watchlistCompanies.length > 3 &&
              ` +${watchlistCompanies.length - 3} more`}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic">
            No companies saved yet
          </p>
        )}
      </Link>

      {/* Recently viewed — placeholder, no tracking yet */}
      <div className="bg-neutral-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="text-neutral-400"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-medium text-neutral-900">
            Recently viewed
          </span>
        </div>
        <p className="text-xs text-neutral-400 italic">Coming soon</p>
      </div>

      {/* Playbook matches */}
      <Link
        href="/playbooks"
        className="bg-neutral-50 rounded-xl p-4 hover:bg-neutral-100 transition-colors group"
      >
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="text-neutral-400 group-hover:text-neutral-600 transition-colors"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-sm font-medium text-neutral-900">
            Playbook matches
          </span>
        </div>
        {playbookMatchCount > 0 ? (
          <p className="text-xs text-neutral-500">
            {playbookMatchCount}{" "}
            {playbookMatchCount === 1 ? "company" : "companies"} across{" "}
            {playbookCount} {playbookCount === 1 ? "playbook" : "playbooks"}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 italic">
            No matches yet
          </p>
        )}
      </Link>
    </div>
  );
}

// ─── Spotlight ──────────────────────────────────────────────

function SpotlightCard({ company }: { company: SpotlightCompany }) {
  return (
    <Link
      href={`/companies/${company.ticker}`}
      className="border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors group block"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">
            {company.ticker}
          </span>
          <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
            {company.name}
          </span>
        </div>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      </div>
      {company.excerpt && (
        <p className="text-[13px] text-neutral-500 leading-relaxed mb-3 line-clamp-2">
          {company.excerpt}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {company.sector && (
          <span className="text-[11px] px-2 py-0.5 bg-violet-50 text-violet-700 rounded">
            {company.sector}
          </span>
        )}
        {company.subsector && company.subsector !== company.sector && (
          <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded">
            {company.subsector}
          </span>
        )}
      </div>
      {company.generatedAt && (
        <p className="text-[11px] text-neutral-400 mt-3 pt-3 border-t border-neutral-100">
          Profiled {timeAgo(company.generatedAt)}
        </p>
      )}
    </Link>
  );
}

function SpotlightEmpty() {
  return (
    <div className="border border-dashed border-neutral-200 rounded-xl p-6 text-center">
      <p className="text-sm text-neutral-500 mb-1">No profiled companies yet</p>
      <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
        When companies are profiled through playbook matches or manual research,
        they&apos;ll appear here with highlights from their analysis.
      </p>
    </div>
  );
}

// ─── Browse Table ───────────────────────────────────────────

type SortField = "market_cap" | "name" | "ticker";
type SortDir = "asc" | "desc";

function BrowseTable({
  sectors,
  totalCompanies,
}: {
  sectors: SectorOption[];
  totalCompanies: number;
}) {
  const [companies, setCompanies] = useState<BrowseCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(totalCompanies);
  const [sectorFilter, setSectorFilter] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("");
  const [profiledOnly, setProfiledOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("market_cap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("core_companies")
      .select(
        "id, ticker, name, sector, subsector, market_cap, exchange, latest_profile_id",
        { count: "exact" }
      );

    // Filters
    if (sectorFilter) {
      query = query.eq("sector", sectorFilter);
    }
    if (exchangeFilter) {
      query = query.eq("exchange", exchangeFilter);
    }
    if (profiledOnly) {
      query = query.not("latest_profile_id", "is", null);
    }

    // Sort
    query = query.order(sortField, {
      ascending: sortDir === "asc",
      nullsFirst: false,
    });

    // Secondary sort by name for stability
    if (sortField !== "name") {
      query = query.order("name", { ascending: true });
    }

    // Pagination
    const from = page * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count } = await query;

    setCompanies(
      (data ?? []).map((c) => ({
        id: c.id as string,
        ticker: c.ticker as string,
        name: c.name as string,
        sector: c.sector as string | null,
        subsector: c.subsector as string | null,
        marketCap: c.market_cap as number | null,
        exchange: c.exchange as string | null,
        hasProfile: c.latest_profile_id !== null,
      }))
    );
    setFilteredTotal(count ?? 0);
    setLoading(false);
  }, [page, sectorFilter, exchangeFilter, profiledOnly, sortField, sortDir]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Reset to page 0 when filters change
  const handleFilterChange = (
    setter: (val: string) => void,
    value: string
  ) => {
    setter(value);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "ticker" ? "asc" : "desc");
    }
    setPage(0);
  };

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap mb-2">
        <select
          value={sectorFilter}
          onChange={(e) => handleFilterChange(setSectorFilter, e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 transition-colors"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={exchangeFilter}
          onChange={(e) => handleFilterChange(setExchangeFilter, e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 transition-colors"
        >
          <option value="">All exchanges</option>
          <option value="NYSE">NYSE</option>
          <option value="NASDAQ">NASDAQ</option>
        </select>

        <button
          onClick={() => {
            setProfiledOnly((p) => !p);
            setPage(0);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
            profiledOnly
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              profiledOnly ? "bg-emerald-500" : "bg-neutral-300"
            }`}
          />
          Profiled only
        </button>

        <span className="text-xs text-neutral-400 ml-auto">
          {filteredTotal.toLocaleString()}{" "}
          {filteredTotal === 1 ? "company" : "companies"}
        </span>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th
                onClick={() => toggleSort("ticker")}
                className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-[72px] cursor-pointer hover:text-neutral-600 select-none"
              >
                Ticker{sortArrow("ticker")}
              </th>
              <th
                onClick={() => toggleSort("name")}
                className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 cursor-pointer hover:text-neutral-600 select-none"
              >
                Company{sortArrow("name")}
              </th>
              <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-[150px]">
                Sector
              </th>
              <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-[70px]">
                Exchange
              </th>
              <th
                onClick={() => toggleSort("market_cap")}
                className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-[100px] cursor-pointer hover:text-neutral-600 select-none"
              >
                Mkt cap{sortArrow("market_cap")}
              </th>
              <th className="text-center text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-[80px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="w-14 h-3.5 bg-neutral-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-36 h-3.5 bg-neutral-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-4 bg-neutral-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-3 bg-neutral-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="w-16 h-3.5 bg-neutral-100 animate-pulse rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-14 h-4 bg-neutral-100 animate-pulse rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </>
            ) : companies.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-neutral-400"
                >
                  No companies match your filters
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${c.ticker}`}
                      className="text-sm font-mono font-medium text-neutral-900 hover:text-neutral-600"
                    >
                      {c.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${c.ticker}`}
                      className="text-sm text-neutral-900 hover:text-neutral-600"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.sector ? (
                      <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded truncate max-w-[130px] inline-block">
                        {c.subsector ?? c.sector}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {c.exchange ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-neutral-500">
                      {formatMarketCap(c.marketCap)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.hasProfile ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Profiled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-neutral-400">
          Page {page + 1} of {totalPages.toLocaleString()}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function CompaniesClient({
  isAuthenticated,
  totalCompanies,
  profiledCount,
  sectorCount,
  spotlightCompanies,
  sectors,
  watchlistCompanies,
  playbookMatchCount,
  playbookCount,
}: CompaniesClientProps) {
  return (
    <div className="p-8 max-w-4xl">
      {/* Hero: title + search */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Companies
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-4">
          Search {totalCompanies.toLocaleString()} companies. Explore AI
          research profiles, filter by sector, sort by market cap.
        </p>
        <SearchBar />
        <div className="flex gap-6 mt-3">
          <span className="text-xs text-neutral-400">
            <span className="font-medium text-neutral-500">
              {totalCompanies.toLocaleString()}
            </span>{" "}
            companies
          </span>
          <span className="text-xs text-neutral-400">
            <span className="font-medium text-neutral-500">
              {profiledCount}
            </span>{" "}
            profiled
          </span>
          <span className="text-xs text-neutral-400">
            <span className="font-medium text-neutral-500">{sectorCount}</span>{" "}
            sectors
          </span>
        </div>
      </div>

      {/* Your companies — only for authenticated users */}
      {isAuthenticated && (
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-base font-medium text-neutral-900">
              Your companies
            </h2>
            <p className="text-xs text-neutral-400">
              Watchlist, recent views, and playbook matches
            </p>
          </div>
          <YourCompanies
            watchlistCompanies={watchlistCompanies}
            playbookMatchCount={playbookMatchCount}
            playbookCount={playbookCount}
          />
        </div>
      )}

      {/* Spotlight: recently profiled */}
      <div className="mb-8 pt-8 border-t border-neutral-100">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-medium text-neutral-900">
              Spotlight
            </h2>
            <p className="text-xs text-neutral-400">
              Recently profiled companies with research highlights
            </p>
          </div>
          {spotlightCompanies.length > 0 && (
            <button
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
              onClick={() => {
                /* TODO: navigate to profiled-only filter */
              }}
            >
              View all profiled →
            </button>
          )}
        </div>
        {spotlightCompanies.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {spotlightCompanies.map((c) => (
              <SpotlightCard key={c.id} company={c} />
            ))}
          </div>
        ) : (
          <SpotlightEmpty />
        )}
      </div>

      {/* Browse all companies */}
      <div className="pt-8 border-t border-neutral-100">
        <div className="mb-3">
          <h2 className="text-base font-medium text-neutral-900">
            Browse all companies
          </h2>
          <p className="text-xs text-neutral-400">
            {totalCompanies.toLocaleString()} US-listed companies across{" "}
            {sectorCount} sectors
          </p>
        </div>
        <BrowseTable sectors={sectors} totalCompanies={totalCompanies} />
      </div>
    </div>
  );
}
