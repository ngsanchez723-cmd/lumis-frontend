"use client";

import { useState } from "react";

interface Sector {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Theme {
  id: string;
  name: string;
  icon: string | null;
}

interface GuidedWizardProps {
  sectors: Sector[];
  subsectors: Sector[];
  themes: Theme[];
  onSubmit: (data: {
    title: string;
    sectors: string[];
    themes: string[];
    growth_preference: string;
    size_preference: string[];
    geographic_focus: string;
    profitability: string;
    conviction: string;
  }) => void;
  submitting: boolean;
}

const GROWTH_OPTIONS = [
  { value: "high_growth", label: "High growth", desc: "Revenue growing 20%+ annually" },
  { value: "moderate_growth", label: "Moderate growth", desc: "Steady 5–20% annual growth" },
  { value: "stable", label: "Stable / value", desc: "Mature businesses, dividends, buybacks" },
  { value: "flexible", label: "No preference", desc: "Open to any growth profile" },
];

const SIZE_OPTIONS = [
  { value: "large_cap", label: "Large cap", desc: "$10B+" },
  { value: "mid_cap", label: "Mid cap", desc: "$2B–$10B" },
  { value: "small_cap", label: "Small cap", desc: "$300M–$2B" },
  { value: "micro_cap", label: "Micro cap", desc: "Under $300M" },
];

const GEO_OPTIONS = [
  { value: "us", label: "United States" },
  { value: "north_america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia-Pacific" },
  { value: "global", label: "Global / no preference" },
];

const PROFIT_OPTIONS = [
  { value: "profitable", label: "Profitable now", desc: "Positive net income" },
  { value: "path_to_profit", label: "Path to profitability", desc: "Not yet profitable but improving" },
  { value: "pre_revenue", label: "Pre-revenue / early stage", desc: "Investing in growth" },
  { value: "flexible", label: "No preference", desc: "Open to any stage" },
];

export function GuidedWizard({
  sectors,
  subsectors,
  themes,
  onSubmit,
  submitting,
}: GuidedWizardProps) {
  const [step, setStep] = useState(0);

  // Step 0: Themes & Sectors
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  // Step 1: Company characteristics
  const [growthPref, setGrowthPref] = useState("flexible");
  const [sizePref, setSizePref] = useState<string[]>([]);
  const [geoPref, setGeoPref] = useState("global");
  const [profitPref, setProfitPref] = useState("flexible");

  // Step 2: Conviction
  const [conviction, setConviction] = useState("");
  const [title, setTitle] = useState("");

  const totalSteps = 3; // 0, 1, 2

  const toggleInArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const canAdvance = () => {
    if (step === 0) return selectedThemes.length > 0 || selectedSectors.length > 0;
    if (step === 1) return true; // All have defaults
    if (step === 2) return title.trim().length > 0 && conviction.trim().length >= 20;
    return false;
  };

  const handleSubmit = () => {
    // Resolve names from IDs
    const themeNames = themes
      .filter((t) => selectedThemes.includes(t.id))
      .map((t) => t.name);
    const sectorNames = sectors
      .filter((s) => selectedSectors.includes(s.id))
      .map((s) => s.name);

    onSubmit({
      title,
      sectors: sectorNames,
      themes: themeNames,
      growth_preference: growthPref,
      size_preference: sizePref.length > 0 ? sizePref : ["flexible"],
      geographic_focus: geoPref,
      profitability: profitPref,
      conviction,
    });
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? "bg-neutral-900" : "bg-neutral-300"
              }`}
            />
            {i < totalSteps - 1 && (
              <div
                className={`w-8 h-px transition-colors ${
                  i < step ? "bg-neutral-900" : "bg-neutral-300"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-neutral-400 ml-2">
          Step {step + 1} of {totalSteps}
        </span>
      </div>

      {/* Step 0: Themes & Sectors */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-1">
              What themes interest you?
            </h2>
            <p className="text-xs text-neutral-500 mb-3">
              Select one or more investment themes — or skip to sectors.
            </p>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemes(toggleInArray(selectedThemes, theme.id))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedThemes.includes(theme.id)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {theme.icon && <span className="mr-1.5">{theme.icon}</span>}
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-1">
              Which sectors?
            </h2>
            <p className="text-xs text-neutral-500 mb-3">
              Optional — narrow your search to specific sectors.
            </p>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => setSelectedSectors(toggleInArray(selectedSectors, sector.id))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedSectors.includes(sector.id)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {sector.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Company characteristics */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Growth */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Growth profile</h2>
            <div className="grid grid-cols-2 gap-2">
              {GROWTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGrowthPref(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    growthPref === opt.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span className="text-sm font-medium text-neutral-900 block">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-1">Company size</h2>
            <p className="text-xs text-neutral-500 mb-3">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSizePref(toggleInArray(sizePref, opt.value))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    sizePref.includes(opt.value)
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span className="text-sm font-medium text-neutral-900 block">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Geography */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Geographic focus</h2>
            <div className="flex flex-wrap gap-2">
              {GEO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGeoPref(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    geoPref === opt.value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profitability */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Profitability</h2>
            <div className="grid grid-cols-2 gap-2">
              {PROFIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProfitPref(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    profitPref === opt.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span className="text-sm font-medium text-neutral-900 block">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Conviction & Title */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="wizard-title" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Playbook name
            </label>
            <input
              id="wizard-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Infrastructure Picks & Shovels"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="conviction" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Your conviction
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              In your own words, why do you believe in this investment thesis? This helps the AI understand your intent.
            </p>
            <textarea
              id="conviction"
              value={conviction}
              onChange={(e) => setConviction(e.target.value)}
              placeholder="I believe these companies will outperform because..."
              rows={5}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              {conviction.trim().length < 20
                ? `${Math.max(0, 20 - conviction.trim().length)} more characters needed`
                : "Great — this will help generate better matches."}
            </p>
          </div>

          {/* Review summary */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-neutral-700">Review your selections:</p>
            {selectedThemes.length > 0 && (
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-700">Themes:</span>{" "}
                {themes
                  .filter((t) => selectedThemes.includes(t.id))
                  .map((t) => t.name)
                  .join(", ")}
              </p>
            )}
            {selectedSectors.length > 0 && (
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-700">Sectors:</span>{" "}
                {sectors
                  .filter((s) => selectedSectors.includes(s.id))
                  .map((s) => s.name)
                  .join(", ")}
              </p>
            )}
            <p className="text-xs text-neutral-500">
              <span className="text-neutral-700">Growth:</span>{" "}
              {GROWTH_OPTIONS.find((o) => o.value === growthPref)?.label}
              {sizePref.length > 0 && (
                <>
                  {" · "}
                  <span className="text-neutral-700">Size:</span>{" "}
                  {sizePref
                    .map((s) => SIZE_OPTIONS.find((o) => o.value === s)?.label)
                    .join(", ")}
                </>
              )}
            </p>
            <p className="text-xs text-neutral-500">
              <span className="text-neutral-700">Geography:</span>{" "}
              {GEO_OPTIONS.find((o) => o.value === geoPref)?.label}
              {" · "}
              <span className="text-neutral-700">Profitability:</span>{" "}
              {PROFIT_OPTIONS.find((o) => o.value === profitPref)?.label}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance() || submitting}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating playbook..." : "Create Playbook"}
          </button>
        )}
      </div>
    </div>
  );
}
