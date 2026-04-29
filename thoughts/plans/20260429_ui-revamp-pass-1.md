# Revamp Flow frontend visuals + fix critical UI/navigation bugs (Pass 1)

**Date:** 2026-04-29
**Status:** reviewed
**Worklog:** thoughts/worklogs/20260429_ui-revamp-pass-1.md

## Context

The Flow frontend reads as unfinished — duplicate kanban tiles, NaN forecasts, a search route with no app shell, dead nav links, decorative brain icons, ubiquitous colored left-bars, and washed pastel alert surfaces in light mode. The design-token foundation (Tailwind v4 `@theme`, oklch CSS vars, MobX `ThemeStore`) is sound; the application of it is not, and a few token values themselves (warn/danger surfaces) need retuning. This run fixes the load-bearing bugs, builds four shared primitives (Card, Chip, FilterButton, Alert), retunes the warn/danger surfaces, and applies the primitives across Deals, Messages, Calendar, Contacts, and Dashboard. Per-page micro-polish beyond this is a deliberate follow-up.

## Locked answers from preflight

- Q: Scope of this run? → A: Bugs + visual revamp pass 1 (option B), plus the one-line backend sentiment math fix.
- Q: Sentiment percentages — bundle the backend fix? → A: Yes. Backend repo lives at `~/Projects/flow/backend` (Phoenix/Elixir).
- Q: Dead nav items (`/analytics`, `/ai-insights`, `/settings`)? → A: Remove them entirely.
- Q: Header global search input — clear on submit, or echo the URL `?q`? → A: Clear on submit.
- Q: Duplicate stage tiles on Deals? → A: Drop entirely; the kanban already conveys it.
- Q: Light-mode alert surfaces look washed-out cream/yellow? → A: Retune the `@theme` tokens, not per-component.
- Q: The floating AI brain rail in the top-right that fights the icon cluster? → A: Reposition/restyle, leave functionality alone.
- Q: Foundation rebuild needed? → A: No. Tokens + theme store + class-based dark are already wired correctly. The fix is consistency of application + a few specific token values.

## Sections

> **Dispatch order:**
> - **Wave 1 (parallel):** A, B, D — independent file sets, no collisions.
> - **Wave 2 (parallel, after B completes):** C, E — both consume primitives created in B.

---

### Section A — Critical bugfixes [strict]

**Why strict:** Every change has a known root cause from preflight tracing. Mechanical, well-bounded, no design judgment required.

**Executive summary**
Fix the `$NaN` forecast on Deals, the missing app shell on `/search`, the stuck spinner on `/search`, the stale value in the header search input, and remove the three dead nav items pointing at routes that don't exist.

**Files touched**
- `src/stores/DealsStore.ts`
- `src/pages/SearchResults.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`

**Success criteria**
- `/deals` header shows real `$X` totals, never `$NaN`, in both header summary and Weighted Forecast.
- `/search?q=foo` renders the same sidebar + header shell as every other authenticated route.
- `/search` (no `q` param) does NOT show a "Searching…" spinner; only shows the spinner while a fetch is genuinely in flight.
- After submitting a search via the header input, the input visibly clears.
- The sidebar shows only nav items whose target route is registered in `App.tsx`. Clicking any sidebar item reaches a real page.

**Phases**

#### A.1 — Fix `$NaN` forecast (snake_case → camelCase)
- **Goal:** Map snake_case fields from `/api/deals-forecast` into the camelCase shape `forecastData` is read with.
- **Files & changes:** `src/stores/DealsStore.ts` — in `fetchForecast()` (around line 502–515), replace the raw `this.forecastData = forecast` assignment with an explicit camelCase mapping that falls back to snake_case keys.
- **Code:**
  ```ts
  // src/stores/DealsStore.ts inside fetchForecast()
  const f = forecast as any
  this.forecastData = {
    totalPipeline: f.totalPipeline ?? f.total_pipeline ?? 0,
    weightedForecast: f.weightedForecast ?? f.weighted_forecast ?? 0,
    dealsClosingThisMonth: f.dealsClosingThisMonth ?? f.deals_closing_this_month ?? 0,
    monthlyForecast: f.monthlyForecast ?? f.monthly_forecast ?? 0,
  }
  ```
- Keep the existing error path. Do not touch other store methods.

#### A.2 — Wrap `SearchResults` in `MainLayout`
- **Goal:** `/search` renders inside the same shell as `/dashboard`.
- **Files & changes:** `src/pages/SearchResults.tsx` — replace the outermost `<div className="min-h-screen bg-background">` with `<MainLayout>`. Import `MainLayout` from `../components/layout/MainLayout`. Remove any redundant header/title block that duplicates what `MainLayout` provides.
- **Note:** Other authenticated pages (`Dashboard`, `Contacts`, etc.) wrap their JSX in `<MainLayout>`. Match that pattern.

#### A.3 — Fix initial `isLoading` state
- **Goal:** The "Searching…" spinner should not show on mount when no query has been issued.
- **Files & changes:** `src/pages/SearchResults.tsx` — change `useState(true)` to `useState(false)` for `isLoading`. The existing `useEffect` already flips it to `true` when a fetch begins.
- If no `q` param is present, render an empty-search empty state instead of the spinner. Reuse the existing empty-state pattern; if none, a single centered headline `Search Flow` + helper text is fine.

#### A.4 — Clear header search input on submit
- **Goal:** The input does not retain stale text after navigating to `/search`.
- **Files & changes:** `src/components/layout/Header.tsx` — verify the existing `setSearchQuery('')` call after `navigate(...)` actually runs (line ~22–23). If the input is uncontrolled or initialized from a prop/store, fix the binding so the visible value clears. The input should use `value={searchQuery}` + `onChange={e => setSearchQuery(e.target.value)}`.

#### A.5 — Remove dead nav items
- **Goal:** No sidebar item links to a route that doesn't exist.
- **Files & changes:** `src/components/layout/Sidebar.tsx` — in the nav items array (line ~22–29), remove the entries for **Analytics** (`/analytics`), **AI Insights** (`/ai-insights`), and **Settings** (`/settings`). Also remove now-unused icon imports (`TrendingUp`, `Brain`, `Settings`) if they have no other use in the file.

---

### Section B — UI primitives + token retune [conscious]

**Why conscious:** Primitive APIs and token values are design decisions that benefit from local judgment within rails. The rails: small, composable, semantic-token-driven, no per-component color hardcodes.

**Executive summary**
Build four primitives (`Card`, `Chip`, `FilterButton`, `Alert`) under `src/components/ui/`. Retune the warn/danger surfaces in `src/index.css` so light-mode alerts read as subtle slate-with-colored-icon (Linear / Notion style), not pastel cream fills. These primitives are consumed by Sections C and E.

**Files touched**
- `src/components/ui/Card.tsx` *(new)*
- `src/components/ui/Chip.tsx` *(new)*
- `src/components/ui/FilterButton.tsx` *(new)*
- `src/components/ui/Alert.tsx` *(new)*
- `src/index.css` *(retune `@theme` tokens for warn/danger surfaces)*

**Success criteria**
- All four primitives exist, are exported, and consume only semantic tokens (`bg-card`, `text-foreground`, `border-border`, etc.) — no `bg-yellow-50`, `text-red-500` style hardcodes.
- `Card` supports default + `interactive` (hover affordance) variants. No border by default — relies on bg-tone separation. Optional `bordered` prop only.
- `Chip` supports `variant: 'default' | 'success' | 'warning' | 'danger' | 'info'` and `size: 'sm' | 'md'`. Tinted but desaturated; no neon.
- `FilterButton` is a real button — left icon slot, label, optional count badge, hover/active state. NOT styled as an empty input box.
- `Alert` supports `variant: 'info' | 'warning' | 'danger' | 'success'` with a left icon, title, and body. No full-bleed pastel fill — subtle bg + colored icon + colored left rule of 2px max.
- `index.css` warn/danger token values pass eyeball test in both light and dark mode at the resulting `Alert` component.
- Existing components do not break (this section adds files and tweaks tokens only; no consumer rewrites here — that's Sections C/E).

**Phases**

#### B.1 — `Card` primitive
- **Goal:** A canonical container so every page stops hand-rolling `<div className="rounded-2xl border border-... p-6">`.
- **Files & changes:** `src/components/ui/Card.tsx` — export `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (shadcn-style API). Use `cn` helper from existing `lib/utils.ts` (or wherever `clsx`+`tailwind-merge` is wrapped — check `src/components/ui/` for an existing `cn` export, otherwise add one to `src/lib/utils.ts`). Tokens only.
- **Code (illustrative):**
  ```tsx
  export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
    ({ className, interactive, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-card text-card-foreground p-6',
          interactive && 'transition-colors hover:bg-card/80 cursor-pointer',
          className,
        )}
        {...props}
      />
    ),
  )
  ```
- Default has NO border. The bg-tone difference from page background carries the separation.

#### B.2 — `Chip` primitive
- **Goal:** Replace ad-hoc tag/badge styling. One source of truth.
- **Files & changes:** `src/components/ui/Chip.tsx`
- **Code (illustrative):**
  ```tsx
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger:  'bg-destructive/10 text-destructive',
    info:    'bg-primary/10 text-primary',
  }
  ```
- If `--success` / `--warning` tokens don't already exist, add them in `index.css` alongside the retune in B.5.

#### B.3 — `FilterButton` primitive
- **Goal:** Replace the empty-box-styled "filter chips" on Calendar / Contacts.
- **Files & changes:** `src/components/ui/FilterButton.tsx`
- API: `<FilterButton icon={Filter} active={isAll} count={5}>All Contacts</FilterButton>`. Real button styling — bg, hover, active border-bottom or fill.
- No ❤️/🧠/decorative emojis. Icon comes only from `lucide-react`.

#### B.4 — `Alert` primitive
- **Goal:** Replace the cream/yellow blocks in Smart Action Feed and elsewhere.
- **Files & changes:** `src/components/ui/Alert.tsx`
- Layout: subtle `bg-muted` (or `bg-{variant}/5`) surface + colored icon + 2px colored left rule + optional action slot. No full pastel fill, no thick yellow bars.

#### B.5 — Retune `@theme` warn/danger tokens
- **Goal:** Make the warn/danger surfaces feel professional in light mode (subtle, not cream).
- **Files & changes:** `src/index.css` `@theme` block. Specifically:
  - Add (or retune) `--color-warning` + `--color-warning-foreground` if absent.
  - Add (or retune) `--color-success` + `--color-success-foreground` if absent.
  - Tweak `--destructive` foreground/usage so it doesn't read as alarmist on otherwise-quiet pages.
- Stick to oklch. Light-mode warning around `oklch(0.75 0.13 85)` for the icon hue, with the surface being `bg-muted` not the warning hue. Verify in dark mode — both modes must look intentional.
- Do NOT broadly change `--background` / `--foreground` / `--card` / `--primary`. Those are working.

---

### Section C — Apply primitives + visual revamp on pages [conscious]

**Why conscious:** Each page has small judgment calls — what's a chip vs. text, what info to drop, whether a card is interactive. Plan rails define the ceiling; executor exercises taste within them.

**Depends on:** Section B (consumes the primitives).

**Executive summary**
Refactor Deals, Messages, Calendar, Contacts to consume the new primitives. Drop duplicate stage tiles on Deals. Kill the colored-left-bar pattern in Messages and Calendar — let the Chip + a small leading icon carry priority/sentiment. Remove decorative brain icons from inputs and filter buttons. Replace empty-box filter chips with `FilterButton`.

**Files touched**
- `src/pages/Deals.tsx`
- `src/pages/Messages.tsx`
- `src/pages/Calendar.tsx`
- `src/pages/Contacts.tsx`

**Success criteria**
- No file in this section renders a hand-rolled `<div>` with `rounded-... border-... p-...` for what `<Card>` covers.
- All tag-like UI uses `<Chip>`. No raw `bg-yellow-...`, `bg-red-...` Tailwind hardcodes.
- All filter pill UI uses `<FilterButton>`.
- Deals page renders the kanban WITHOUT the duplicate per-stage summary tiles at the top.
- Messages and Calendar conversation/event cards have NO colored left-bar. Priority / sentiment is conveyed via a single leading icon + a `Chip`.
- No `🧠` or other decorative emoji inside inputs or filter buttons.
- `npm run build` passes; no TS errors introduced.

**Phases**

#### C.1 — Deals page revamp
- **Goal:** Drop duplicate stage tiles; clean up deal card visual noise.
- **Files & changes:** `src/pages/Deals.tsx`.
  - Remove the per-stage summary tile grid (the row of Prospect/Qualified/Proposal/Negotiation/Closed Won/Closed Lost cards above the kanban). Keep the single-line header summary (`9 active deals`, `$X pipeline`, `$Y Weighted Forecast`).
  - Refactor each kanban column header to use `<Card>` + tighter typography. Stage colors stay as a **single accent dot or text color**, not full-bleed neon pills.
  - Refactor deal cards inside columns to use `<Card>` (interactive) + `<Chip>` for priority/AI%/tags. The "30% AI" / "65% AI" pastel pills become `<Chip variant="info" size="sm">`.
  - Remove the brain emoji inside the search input. Use lucide `Search` icon only.
- The "$NaN" header values are NOT this section's job — Section A fixes them.

#### C.2 — Messages page revamp
- **Goal:** Kill the alarming red left-bar; normalize density.
- **Files & changes:** `src/pages/Messages.tsx`.
  - Conversation cards: drop the colored left-bar entirely. Use `<Card>` + a single sentiment leading icon (`SentimentIndicator` already exists — reuse if it fits the new look) + a `<Chip>` for "Hot Lead" / "Urgent".
  - "Overall Sentiment" trio: rebuild as three compact `<Card>`s using `<Chip>` accents. The math fix is Section D's responsibility — render whatever the store reports.
  - Remove brain emoji in search/filter inputs; replace filter dropdown with `<FilterButton>`.

#### C.3 — Calendar page revamp
- **Goal:** Same treatment as Messages.
- **Files & changes:** `src/pages/Calendar.tsx`.
  - Event cards: drop colored left-bar. Use `<Card>` + a single leading calendar icon + `<Chip variant="warning">High Priority</Chip>`.
  - Today / Past Events sections: keep the section headers but use `<FilterButton>` for "Meetings This Week" / "High Priority" filters.
  - Remove brain emoji in search input.

#### C.4 — Contacts page revamp
- **Goal:** Apply primitives; fix filter chips.
- **Files & changes:** `src/pages/Contacts.tsx`.
  - Contact cards: `<Card>` + reuse existing `HealthScore` component (it's already a good primitive) + `<Chip>` for "Hot Lead", "Enterprise", etc.
  - "High Value" / "At Risk" filter pills → `<FilterButton>`.
  - Remove brain emoji in search/filter.

---

### Section D — Backend sentiment percentage fix [strict]

**Why strict:** One-line math fix in a single Elixir handler. No judgment.

**Working directory:** `/Users/noob/Projects/flow/backend` (separate Phoenix/Elixir repo).

**Executive summary**
The `/api/messages-sentiment-overview` handler returns raw counts (e.g. `4`, `2`, `0`) but the frontend renders them as percentages with a `%` suffix. Convert counts to percentages in the handler.

**Files touched**
- `lib/flow_api_web/controllers/conversation_controller.ex`

**Success criteria**
- `GET /api/messages-sentiment-overview` returns `{ positive: number, neutral: number, negative: number }` where the three values sum to 100 (within rounding) when there are messages, or all-zero when there are no messages.
- Existing tests still pass; if a test asserted the old (broken) shape, update it minimally.
- No frontend changes — Section C's Messages page reads whatever the API returns.

**Phases**

#### D.1 — Compute percentages in `sentiment_overview`
- **Goal:** Divide each bucket by the total message count and multiply by 100.
- **Files & changes:** `lib/flow_api_web/controllers/conversation_controller.ex` — function `sentiment_overview/2` at line 139.
  - Read the existing implementation. Identify where positive/neutral/negative counts are computed.
  - Compute `total = positive + neutral + negative`.
  - If `total == 0`, return all-zero. Otherwise return `%{positive: positive / total * 100, neutral: neutral / total * 100, negative: negative / total * 100}` (rounding handled client-side via `Math.round`).
- Run `mix test` for the conversation controller tests; fix any that asserted the prior (count-as-percentage) shape.

---

### Section E — AICopilot rail + Dashboard polish [conscious]

**Depends on:** Section B (consumes `Alert`, `Card`).

**Executive summary**
Reposition the floating AI copilot rail so it doesn't overlap the top-right icon cluster. Apply the new `Alert` primitive to the Dashboard's Smart Action Feed (kills the cream/yellow blocks). Tighten the AI Forecast card so a low-confidence projection doesn't render as an alarm.

**Files touched**
- `src/components/layout/AICopilot.tsx`
- `src/pages/Dashboard.tsx`

**Success criteria**
- AICopilot's collapsed handle (the floating brain + arrow) is positioned to NOT visually compete with the top-right header icons. Acceptable solutions: dock it as part of the header icon cluster, OR move it to bottom-right (FAB-style), OR collapse it into a single header button.
- AICopilot's expanded panel still works exactly as before.
- Dashboard Smart Action Feed items render via `<Alert variant="warning">`. No more cream/yellow full-bleed blocks.
- AI Forecast card uses `<Card>`. The "Low Confidence" indicator uses `<Chip variant="warning" size="sm">`, not a giant red dot + bold red label.

**Phases**

#### E.1 — Reposition AICopilot
- **Goal:** End the visual collision with header icons.
- **Files & changes:** `src/components/layout/AICopilot.tsx`. Pick one approach (executor's call):
  - Option A: integrate the toggle into the `Header` icon cluster as one more icon button. Open state still uses the existing side panel.
  - Option B: dock the collapsed handle to bottom-right as a single circular FAB.
- Keep the open/close state machine intact. Don't rewire the panel internals.

#### E.2 — Dashboard restyle
- **Goal:** Apply `Alert` and `Card`. Calm down the AI Forecast card.
- **Files & changes:** `src/pages/Dashboard.tsx`.
  - Smart Action Feed `<Alert variant="warning">` per item, with `<Button>` (existing or hand-rolled) actions.
  - AI Forecast `<Card>`, headline number in regular weight, "Low Confidence" as `<Chip variant="warning" size="sm">`.
  - Stale "show me deals about to close" search bar value: not this section's job (Section A).
