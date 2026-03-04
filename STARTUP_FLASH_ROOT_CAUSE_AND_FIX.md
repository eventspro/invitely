# Startup Flash — Root Cause Analysis & Fix (v2 — definitive)

## STATUS: FIXED

---

## Part 1 — Why the fix in v1 still flashed

### The `isInitialMount` pattern was fundamentally broken

The v1 fix added this guard to `LanguageContext.tsx`:

```tsx
const isInitialMount = React.useRef(true);
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    if (prefetchedData && ...) return; // try to skip
  }
  fetchTranslations(); // ← still called in two cases
}, [currentLanguage]);
```

**Two execution paths still triggered `fetchTranslations()` after first render:**

1. **React Strict Mode (dev)**: React 18 + StrictMode double-invokes effects for detecting side-effect bugs.
   - Run 1: `isInitialMount.current = true` → sets to `false` → `prefetchedData` valid → `return` ✓
   - Cleanup: no cleanup registered — ref mutation is NOT rolled back
   - **Run 2**: `isInitialMount.current` is already `false` → falls through → `fetchTranslations()` ← FLASH ❌

2. **Any parent re-render that unmounts + remounts `LanguageProvider`**: would create a new `useRef(true)` instance, but on second mount `isInitialMount.current` starts `true` again → skips → OK... Actually this path was safe. Path 1 was the primary culprit.

### Timeline of the flash (v1, with isInitialMount guard, Strict Mode)

```
t=0ms      bootstrap() running — TypingLoader visible
t=~300ms   bootstrap() resolves → setPhase("ready") + setData(d) (React 18 batched)
t=~300ms   <App bootstrapData={d}> renders for the first time
t=~300ms   LanguageProvider mounts, useState lazy init → buildInitialCache(prefetchedData) → CORRECT data ✓
t=~300ms   Children render with CORRECT translated text ✓
t=~300ms   useEffect (Run 1, Strict Mode): isInitialMount=true → false → prefetchedData valid → SKIP ✓
t=~300ms   Strict Mode cleanup (no-op)
t=~300ms   useEffect (Run 2, Strict Mode): isInitialMount=false → fetchTranslations() called ← PROBLEM
t=~300ms   fetchTranslations: setIsLoading(true) → re-render (isLoading=true, t still correct)
t=~700ms   /api/translations response arrives → setTranslationsCache(merged) → re-render
           ↑ this re-render is redundant and causes visible repaint = FLASH
```

---

## Part 2 — Confirmed root cause (v2 diagnosis)

**File**: `client/src/contexts/LanguageContext.tsx` (pre-fix)  
**Lines responsible**: the `useEffect` at line ~165 that called `fetchTranslations()` on `currentLanguage` change

The architectural flaw: having a `useEffect` that triggers network fetches on every language change, then trying to suppress it with a fragile `useRef` flag. The flag worked in production non-strict single-effect execution, but any deviation (strict mode, double invocation, subtle re-render) bypassed it.

---

## Part 3 — The correct fix (v2 implementation)

### Root fix: eliminate the auto-fetch useEffect entirely

`LanguageContext.tsx` — the `useEffect(() => { fetchTranslations() }, [currentLanguage])` is **deleted**.

**Why this is safe:**
- `buildCacheFromPrefetch(prefetchedData)` runs synchronously inside `useState()` lazy initializer
- `prefetchedData` = `bootstrap().translations` = already contains `{ en, hy, ru }` fully merged with DB data
- `translationsCache` starts with final correct state for ALL three languages
- Switching language (`setLanguage("en")`) just changes `currentLanguage`, which changes which cache key `t = translationsCache[currentLanguage]` selects — **no network needed**
- `fetchTranslations()` is still available via `refreshTranslations()` for admin panel use only

### Boot console logs added

`main.tsx`:
```
[BOOT] main.tsx loaded   2026-03-04T...
[BOOT] rendering App (ready)   2026-03-04T...
```

`LanguageContext.tsx`:
```
[BOOT] LanguageContext: building initial cache from prefetched data
```

These appear in DEV only (`import.meta.env.DEV`). The order `main.tsx loaded` → `rendering App (ready)` → `LanguageContext: building initial cache` proves bootstrap completes before any UI renders.

### Changed files

| File | Change |
|------|--------|
| `client/src/main.tsx` | Added `[BOOT] main.tsx loaded` + `[BOOT] rendering App (ready)` console logs |
| `client/src/contexts/LanguageContext.tsx` | **Deleted** the `useEffect(() => fetchTranslations(), [currentLanguage])` auto-fetch. Language switch is now pure state (no network). `fetchTranslations` demoted to explicit-refresh-only. `deepMerge` rewritten as cleaner single module-level function. |

---

## Part 4 — What signals define "ready"

| Signal | Resolved by | Timing |
|--------|-------------|--------|
| `/api/translations` fetched & valid | `bootstrap()` in `main.tsx` | Before `<App />` ever mounts |
| `/api/maintenance` fetched & valid | `bootstrap()` in `main.tsx` | Before `<App />` ever mounts |
| Language determined from localStorage | Synchronous read in `getStoredLanguage()` | Before any render |
| `translationsCache` initialized | `useState(() => buildCacheFromPrefetch(...))` | First render, synchronous |

**`setTranslationsCache()` is never called after first render unless admin explicitly calls `refreshTranslations()`.**

---

## Part 5 — How to verify: Slow 3G checklist

### Setup
1. Open Chrome DevTools → Network tab → Set throttle to **Slow 3G**
2. Check **Disable cache**
3. Open Console tab — filter to `[BOOT]`

### Test sequence

- [ ] Hard-reload (`Ctrl+Shift+R`)
- [ ] `[BOOT] main.tsx loaded` appears immediately in console
- [ ] TypingLoader is visible while network tab shows `/api/translations` and `/api/maintenance` pending
- [ ] When both complete: `[BOOT] rendering App (ready)` appears
- [ ] `[BOOT] LanguageContext: building initial cache from prefetched data` appears next
- [ ] Page appears ONCE with correct translated text — no static text flash before it
- [ ] `🔄 fetchTranslations started` does NOT appear in console (that log is now in explicit-refresh only)
- [ ] Switch language in the UI → only `localStorage.setItem` fires, NO network request in Network tab

### Test: network failure
- [ ] Block `/api/translations` in DevTools (right-click → Block request URL)
- [ ] Hard-reload
- [ ] Error screen appears ("Could not connect...") — NOT a page with default English fallback text
- [ ] Click **Retry** → translations and maintenance fetched → page loads correctly

---

## Part 6 — Tradeoffs

| Concern | Impact | Notes |
|---------|--------|-------|
| Language switch no longer re-fetches | Safe — all 3 languages pre-loaded at boot | Admin has `refreshTranslations()` for live content updates |
| Boot time increases by ~200–400ms (waits for API) | Acceptable — both calls parallel, Vercel edge is fast | Tradeoff: zero flash vs ~400ms extra wait |
| Error screen on network failure | Better UX — explicit recovery path | User knows to retry instead of seeing wrong content |


## 1. Root Cause (proven from code)

### A) App entry point
**`client/src/main.tsx` (pre-fix, line 1–11)**  
`createRoot(rootEl).render(<App />)` was called immediately with no preparation.  
`<App />` then spawned async fetches *after* mounting — meaning React rendered the full
component tree with static fallback strings before any data arrived.

---

### B) Where translations were loaded — and why they were late

**`client/src/App.tsx` (pre-fix, lines 122–145)**
```tsx
// loading=true until BOTH: 1200ms elapsed AND /api/translations has responded.
const [loading, setLoading] = useState(true);
const [prefetchedTranslations, setPrefetchedTranslations] = useState<any>(null);

useEffect(() => {
  const translationsFetch = fetch("/api/translations")
    .then((r) => r.json())
    .then((data) => { setPrefetchedTranslations(data); return data; })
    .catch(() => null);
  const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1200));   // ← arbitrary timer
  Promise.all([translationsFetch, minDelay]).finally(() => setLoading(false));
}, []);
```
- `useEffect` runs **after** the first render — React renders `<TypingLoader />` OK on the
  first frame, but this was gated by a **1 200 ms timeout** rather than actual data readiness.
- `setPrefetchedTranslations` and `setLoading(false)` are called in separate microtask
  continuations. React 18 batches them in most cases, but a slow network meant
  `prefetchedTranslations` could still be `null` when `loading` flipped to `false`.
- When `prefetchedTranslations` was `null`, `LanguageProvider.buildInitialCache()` fell
  back to `staticTranslations` — the bundled English/Armenian/Russian defaults — for the
  **entire first render of the real UI**.

**`client/src/contexts/LanguageContext.tsx` (pre-fix, line ~165)**
```tsx
// Load translations on mount
useEffect(() => {
  fetchTranslations();   // ← fires EVERY mount AND every language switch
}, [currentLanguage]);
```
- Even when `prefetchedData` was correctly supplied, this effect immediately issued a
  **second** `/api/translations` fetch on mount, setting `isLoading=true` again and
  scheduling another `setTranslationsCache(merged)` call.  
- During the async window of that second fetch (50–500 ms), components that render
  conditionally on `isLoading` could switch state, and any parent that re-rendered would
  pick up the interim static cache.

**`client/src/App.tsx` → `AppContent` (pre-fix, line ~96)**
```tsx
if (!maintenanceChecked) return null;   // ← blank white gap after TypingLoader ended
```
- After `loading` became `false` the full provider tree mounted, but `AppContent`
  immediately returned `null` while it fired its own `fetch("/api/maintenance")`.
- This produced a second invisible gap (50–300 ms) where the DOM showed nothing, then
  the real page rendered with whatever translation state existed at that moment.

---

### C) Flash timeline (before fix)

```
t=0ms      main.tsx: createRoot → render <App />
t=1ms      App mounts, starts useEffect for translations + 1200ms timer
t=1ms      TypingLoader displayed ✓
t=~400ms   /api/translations responds → setPrefetchedTranslations(data)
t=1200ms   setTimeout fires → setLoading(false) — React re-renders
t=1200ms   LanguageProvider mounts with prefetchedData (correct so far)
t=1201ms   BUT LanguageContext.useEffect fires → fetchTranslations() again
t=1201ms   AppContent mounts → fetch("/api/maintenance") → returns null (blank gap)
t=~1250ms  maintenance resolves → AppContent renders Router
t=~1250ms  Page visible with static fallback text ← FLASH STARTS
t=~1700ms  second /api/translations resolves → setTranslationsCache(dbData)
t=~1700ms  Correct text appears ← flash ends
```

---

## 2. What Was Changed

### `client/src/main.tsx` — complete rewrite

| Before | After |
|--------|-------|
| Immediately called `createRoot().render(<App />)` | `async bootstrap()` runs first |
| No error handling at startup | Full-screen error + **Retry** button on failure |
| 1 200 ms arbitrary timer in App | Gated on real `Promise.all([fetch translations, fetch maintenance])` |
| `<App />` received no startup data | `<App bootstrapData={…} />` receives fully-resolved data |

New `bootstrap()` function:
1. `Promise.all([fetch("/api/translations"), fetch("/api/maintenance")])`
2. Validates translations shape (`en | hy | ru` keys present)
3. Reads `localStorage` for maintenance bypass / `?preview=true`
4. Resolves to `BootstrapData`

A tiny `Root` component (no JSX dependency on React being initialized via `createElement`)
manages three phases: `"loading"` → `<TypingLoader />`, `"error"` → error screen,
`"ready"` → `<App bootstrapData={data} />`.

### `client/src/App.tsx` — simplified

- **Removed**: `useEffect`, `useState(loading)`, `useState(prefetchedTranslations)`,
  `TypingLoader` import, `setTimeout(1200)`.
- **Removed**: `AppContent`'s async maintenance fetch + `maintenanceChecked` null-return.
- `App` now accepts `{ bootstrapData: BootstrapData }` and passes pre-fetched values
  directly to `LanguageProvider` and `AppContent`.
- `AppContent` accepts `maintenanceEnabled` + `maintenanceBypassed` as props — renders
  synchronously with no async gap.

### `client/src/contexts/LanguageContext.tsx` — skip redundant initial fetch

```tsx
const isInitialMount = React.useRef(true);
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    if (prefetchedData && ('en' in prefetchedData || 'hy' in prefetchedData || 'ru' in prefetchedData)) {
      // DEV log: translations ready, appReady = true
      return;   // ← skip re-fetch, data is already loaded
    }
  }
  fetchTranslations();   // only runs on real language switch
}, [currentLanguage]);
```

---

## 3. What Signals Define "Ready"

The app now renders its UI only when **all three** are done:

| Signal | Source | How resolved |
|--------|--------|--------------|
| Translations loaded | `GET /api/translations` | HTTP 200 + valid `{en,hy,ru}` shape |
| Maintenance state known | `GET /api/maintenance` | HTTP 200 |
| Language determined | `localStorage` | Synchronous read before fetch |

---

## 4. Error / Retry Behaviour

If either API call fails (network error, 5xx, invalid JSON):
- `bootstrap()` throws → `Root` sets `phase = "error"`.
- Full-screen white overlay with "Could not connect to the server" message.
- **Retry** button re-runs `bootstrap()` and loops back through `"loading"` →
  `<TypingLoader />` → attempt again.
- Static fallback text is **never** shown — the app stays on the error screen until
  real data arrives or the user navigates away.

---

## 5. Dev Diagnostic Logs

When `import.meta.env.DEV` is true, the console emits:

```
[4ever.am] ✅ Translations ready: ["en", "hy", "ru"]
[4ever.am] ✅ Maintenance state: false | bypassed: false
[4ever.am] ✅ appReady = true
```

These fire in `bootstrap()` **before** `<App />` is rendered, proving readiness order.

In `LanguageContext` (when prefetched data is used):
```
[4ever.am] ✅ Translations ready: using prefetched bootstrap data, skipping initial re-fetch
[4ever.am] ✅ appReady = true
```

---

## 6. How to Test

### Disable-cache hard reload (recommended)
1. Open DevTools → Network → check **Disable cache**.
2. Set throttle to **Slow 3G**.
3. Hard-reload (`Ctrl+Shift+R`).
4. Observe: `TypingLoader` stays visible until both API calls complete.
5. When loader disappears, verify the correct translated text appears immediately — no flash.

### Verify no static default ever shows
1. In DevTools Network, block `api/translations` (`Right-click → Block request URL`).
2. Hard-reload.
3. Observe: error screen appears (not a page with default text).
4. Unblock, click **Retry** → bootstrap succeeds → correct page renders.

### Verify language switch still re-fetches
1. Open the site normally.
2. Switch language in the UI.
3. Observe Network tab — `/api/translations` fires once on the switch (not on initial mount).

---

## 7. Tradeoffs

| Concern | Impact | Mitigation |
|---------|--------|-----------|
| Longer perceived first load (waits for 2 API calls) | Moderate — both calls typically finish in 100–400 ms on production | `Promise.all` runs them in parallel; Vercel edge is fast |
| No minimum loader duration (TypingLoader may flash briefly) | Minor — on fast connections the animation may not complete | Acceptable; user asked to remove arbitrary timeouts |
| Error screen shown on intermittent network | Good UX — user knows something is wrong | Retry button is one click |
| Language-switch still triggers a fetch | Expected behaviour — user actively changed language | Skip-on-mount logic uses `isInitialMount` ref |
