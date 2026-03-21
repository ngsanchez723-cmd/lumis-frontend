---
name: lumis-brand
description: Brand guidelines and design system for the Lumis platform. This skill governs all visual and tonal decisions — colors, typography, spacing, icons, component styling, UI tone, and content voice. Trigger whenever creating or modifying UI components, pages, layouts, styles, or any user-facing content for Lumis. Also trigger when choosing colors, fonts, spacing, border radius, shadows, icons, illustrations, loading states, empty states, error messages, or any visual/written element users will see. If you are about to make a styling or design decision for Lumis without consulting this skill, stop and check it first.
---

# Lumis Brand Skill

**Status: SCAFFOLD — Key decisions pending. Follow what's defined here. For anything marked TBD, ask Nick before making a choice.**

Lumis is a qualitative-first retail investment intelligence platform. The brand should feel like a **smart, calm research workspace** — not a trading terminal, not a news feed, not a fintech startup with neon gradients.

---

## Brand Identity

### Name
**Lumis** — from Latin _lumen_ (light, illumination, clarity).

### Brand Personality
- **Informed, not intimidating.** Accessible to curious learners, respected by experienced investors.
- **Calm confidence.** The UI should feel like a well-organized library, not a stock ticker.
- **Qualitative-first.** Numbers support narratives, not the other way around.
- **Premium but approachable.** Not flashy. Not boring. Thoughtful.

### Tone of Voice
- Write for someone smart but not necessarily finance-literate.
- Use plain language. Say "competitive advantage" not "sustainable economic moat."
- Never sound like financial advice. Use "research," "explore," "evaluate" — never "recommend," "buy," "sell."
- AI-generated content should feel like a knowledgeable friend explaining something, not a Bloomberg terminal.
- Error messages should be helpful and human: "We couldn't load this profile right now. Try again in a moment." — not "Error 500: Internal Server Error."

---

## Design Tokens

> **TBD = Not yet decided. Ask Nick before using a placeholder.**

### Color Palette

```
TBD — Primary color not yet selected.

Interim guidance:
- Do NOT default to purple gradients, neon accents, or generic fintech blue.
- Do NOT use red/green for positive/negative (accessibility issue + trading terminal association).
- Lean toward: muted, sophisticated tones. Think Notion, Linear, or Stripe — not Robinhood.
- When you need a color and none is defined, use neutral grays (slate/zinc from Tailwind) and flag it for Nick to replace.
```

**When defined, tokens will follow this structure:**
```css
/* Core */
--color-primary:        TBD;
--color-primary-hover:  TBD;
--color-primary-subtle: TBD;  /* backgrounds, badges */

/* Neutrals */
--color-bg:             TBD;  /* page background */
--color-surface:        TBD;  /* card/panel background */
--color-border:         TBD;
--color-text-primary:   TBD;
--color-text-secondary: TBD;
--color-text-muted:     TBD;

/* Semantic */
--color-success:        TBD;  /* NOT green — find a non-trading alternative */
--color-warning:        TBD;
--color-error:          TBD;
--color-info:           TBD;

/* Scoring */
--color-score-high:     TBD;  /* 80-100 */
--color-score-mid:      TBD;  /* 50-79 */
--color-score-low:      TBD;  /* 0-49 */
```

### Typography

```
TBD — Fonts not yet selected.

Interim guidance:
- Do NOT use Inter, Roboto, or Arial — they're generic.
- When you need a font and none is defined, use the system font stack and flag it for Nick.
- We'll likely want: one display/heading font (distinctive) + one body font (highly readable).
- Font loading: use next/font for performance. No external CDN font loads.
```

**When defined:**
```css
--font-heading:     TBD;
--font-body:        TBD;
--font-mono:        TBD;  /* code, tickers, scores */

--text-xs:          0.75rem;   /* 12px — labels, captions */
--text-sm:          0.875rem;  /* 14px — secondary text */
--text-base:        1rem;      /* 16px — body */
--text-lg:          1.125rem;  /* 18px — card titles */
--text-xl:          1.25rem;   /* 20px — section headers */
--text-2xl:         1.5rem;    /* 24px — page titles */
--text-3xl:         1.875rem;  /* 30px — hero text */
```

### Spacing

```
Follow Tailwind's default spacing scale (4px base).
Standard content max-width: max-w-6xl (1152px).
Card padding: p-6 (24px).
Section gap: space-y-8 (32px).
```

### Border Radius

```
TBD — Sharp or rounded not yet decided.

Interim guidance:
- Default to rounded-lg (8px) for cards and panels.
- rounded-md (6px) for buttons and inputs.
- rounded-full for avatars and badges.
- Stay consistent — don't mix sharp and round in the same view.
```

### Shadows & Depth

```
TBD — Flat or elevated not yet decided.

Interim guidance:
- Default to minimal: shadow-sm for cards, no shadow for most elements.
- Lumis should feel more "flat with subtle borders" than "elevated with shadows."
- Reserve shadow-md or shadow-lg for modals and popovers only.
```

---

## Component Patterns

### Buttons
```
Primary:   [primary-color bg] + white text + rounded-md + font-medium
Secondary: transparent + border + [primary-color text] + rounded-md
Ghost:     transparent + no border + [text-secondary] + hover:bg-subtle
Danger:    reserved for destructive actions only (delete account, etc.)

Size: default h-10 px-4, small h-8 px-3 text-sm
```

### Cards
```
Background: --color-surface
Border:     1px solid --color-border
Radius:     rounded-lg
Padding:    p-6
Hover:      subtle border color change or shadow-sm, NOT background color change
```

### Score Display
```
TBD — How scores (0-100) are visually represented.

Options to decide:
- Circular gauge vs. horizontal bar vs. plain number with color badge
- Per-dimension breakdown: bar chart vs. radar chart vs. simple list
- AI score vs. user score side-by-side layout

Interim: display as plain number in a rounded badge with --color-score-high/mid/low.
```

### Loading States
```
Use skeleton loaders (gray pulsing blocks matching content shape), NOT spinners.
AI pipeline operations (30-60s) need a progress indicator with status text:
  "Analyzing your thesis..." → "Finding matching companies..." → "Generating profiles..."
```

### Empty States
```
Every list/grid view needs a designed empty state:
- Friendly illustration or icon (TBD)
- One line of context: "No playbooks yet"
- Clear CTA: "Create your first playbook →"
- Never show a blank page or just "No results."
```

### Error States
```
User-facing errors are always:
- Human-readable ("We couldn't load this" not "Error 500")
- Actionable ("Try refreshing the page" or "Go back to Dashboard")
- Never show stack traces, table names, or internal IDs
```

---

## Icons

```
TBD — Icon library not yet selected.

Options: Lucide (popular with Next.js), Heroicons, Phosphor, custom
Interim: use Lucide if you need icons now (already available in the stack). Flag for Nick to confirm.

Usage rules (apply regardless of library):
- Consistent size within context (16px inline, 20px in nav, 24px standalone)
- Consistent stroke weight
- Use semantic icons (search = magnifying glass, not binoculars)
- Never use icons without accessible labels (aria-label or sr-only text)
```

---

## Logo

```
TBD — No logo yet.

Interim: use the text "Lumis" in the heading font as a wordmark.
Do NOT create a placeholder logo or icon. Just the wordmark.
```

---

## Dark Mode

```
TBD — Not in MVP scope. Do not implement dark mode.

But: write styles using CSS variables (not hardcoded colors) so dark mode can be added later without rewriting every component.
```

---

## What to Do When Something Is TBD

1. **Check this file** — if it says TBD, don't guess.
2. **Use the interim guidance** if provided.
3. **Ask Nick** if no interim guidance exists.
4. **Use Tailwind's neutral slate/zinc palette** as a safe fallback for any unlabeled color.
5. **Always flag TBD decisions in your summary** so Nick knows what needs to be revisited.
6. **Never commit to a brand-defining choice** (primary color, font, logo) without Nick's approval.
