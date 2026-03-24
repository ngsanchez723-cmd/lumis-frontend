"use client";

import { useState } from "react";

interface FreeTextInputProps {
  onSubmit: (title: string, rawInput: string) => void;
  submitting: boolean;
}

const exampleTheses = [
  "I think AI infrastructure companies — the picks-and-shovels of the AI boom — are undervalued relative to the AI application layer. I want to find mid-cap companies building the compute, networking, and data center infrastructure that every AI company depends on.",
  "The aging population in developed countries is creating massive demand for healthcare services and medical devices. I'm looking for profitable companies with strong competitive moats in elder care, remote patient monitoring, and diagnostic equipment.",
  "I believe the energy transition will take longer than markets expect, and traditional energy companies with disciplined capital allocation and growing dividends are being mispriced. Looking for value plays in oil & gas with strong balance sheets.",
];

export function FreeTextInput({ onSubmit, submitting }: FreeTextInputProps) {
  const [title, setTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [showExample, setShowExample] = useState(false);

  const canSubmit = title.trim().length > 0 && rawInput.trim().length >= 50;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Playbook name
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., AI Infrastructure Picks & Shovels"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
        />
      </div>

      {/* Thesis input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="thesis" className="block text-sm font-medium text-neutral-900">
            Your investment thesis
          </label>
          <button
            type="button"
            onClick={() => setShowExample(!showExample)}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showExample ? "Hide examples" : "Show examples"}
          </button>
        </div>

        {showExample && (
          <div className="mb-3 space-y-2">
            {exampleTheses.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setRawInput(ex);
                  setShowExample(false);
                }}
                className="block w-full text-left p-3 border border-neutral-200 rounded-lg text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
              >
                {ex}
              </button>
            ))}
            <p className="text-xs text-neutral-400">Click an example to use it as a starting point.</p>
          </div>
        )}

        <textarea
          id="thesis"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Describe what you're looking for in plain language. What trends do you believe in? What kinds of companies are you looking for? What characteristics matter to you — size, growth, profitability, geography?"
          rows={8}
          className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
        />
        <p className="text-xs text-neutral-400 mt-1.5">
          {rawInput.trim().length < 50
            ? `${Math.max(0, 50 - rawInput.trim().length)} more characters needed`
            : "Looks good — the more detail you provide, the better the matches."}
        </p>
      </div>

      {/* How it works */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <p className="text-xs text-neutral-500 leading-relaxed">
          <span className="font-medium text-neutral-700">How it works:</span>{" "}
          Your thesis will be analyzed by AI to extract investment criteria — sectors, themes,
          company characteristics — then matched against public companies using real-time web research.
          Each match gets a qualitative profile and a fit score against your criteria.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={() => onSubmit(title, rawInput)}
        disabled={!canSubmit || submitting}
        className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating playbook..." : "Create Playbook"}
      </button>
    </div>
  );
}
