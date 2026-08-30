# Modern Ranch Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Variant A — Modern Ranch Editorial across Sapi Papi Farm while preserving all data, safe CRUD, finance calculations, demo login, routing, and PWA behavior.

**Architecture:** Keep the existing React component tree and introduce a small ranch presentation layer through global CSS tokens plus reusable semantic classes. Apply the visual direction to the shell, login, dashboard, and finance surfaces without changing service or domain code. Decorative elements remain CSS/SVG-only, non-interactive, and absent behind dense data tables.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Lucide React, Vite, Vitest, Puppeteer/browser QA, Node 22.

## Global Constraints

- No change to finance formulas, safe CRUD, authentication contract, routes, or PWA assets.
- WCAG AA text contrast, visible focus states, keyboard navigation, and 44px touch targets.
- Responsive checkpoints: 375px, 768px, 1024px, and 1440px.
- No purple/blue gradients, glassmorphism, emoji icons, excessive rounded cards, or gratuitous motion.
- Dust/aged-paper texture must remain low-opacity and must not sit behind tables or form controls.
- Preserve `prefers-reduced-motion` behavior.
- Do not push, merge, or deploy during implementation.

---

### Task 1: Ranch design tokens and semantic primitives

**Files:**
- Modify: `frontend/src/index.css`
- Test: `frontend/src/index.css` through TypeScript/build and browser contrast/overflow inspection

**Interfaces:**
- Produces semantic classes: `.app-surface`, `.app-navbar`, `.app-sidebar`, `.workspace-main`, `.ranch-panel`, `.ranch-heading`, `.ranch-label`, `.ranch-divider`, `.ranch-ribbon`, `.ranch-action-primary`, `.ranch-action-secondary`, `.ranch-input`, `.card-polish`.
- Consumes no domain state.

- [ ] **Step 1: Establish token contract**

Use this token family:

```css
:root {
  --ranch-ink: #24150f;
  --ranch-leather: #5a2d1f;
  --ranch-rust: #a8462d;
  --ranch-ember: #c66c3c;
  --ranch-parchment: #f3ddb0;
  --ranch-canvas: #fff8e8;
  --ranch-line: #d2ad76;
  --ranch-olive: #69704a;
  --ranch-teal: #315864;
  --ranch-muted: #6f6254;
}
```

- [ ] **Step 2: Add semantic classes and remove obsolete emerald-specific defaults**

Buttons, inputs, panels, labels, dividers, and focus outlines must consume tokens instead of page-specific green values.

- [ ] **Step 3: Run static checks**

Run:

```bash
npx --yes --package=node@22 -- bash -lc 'npm run lint -w frontend && npm run build -w frontend'
```

Expected: exit 0; PWA assets generated.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: establish modern ranch design tokens"
```

### Task 2: Shell, brand, and navigation treatment

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/components/layout/MobileNavigationDrawer.tsx`
- Modify: `frontend/src/components/layout/BottomNav.tsx`
- Modify: `frontend/src/components/brand/SapiPapiLogo.tsx`
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes semantic classes from Task 1.
- Preserves existing `activeTab`, `setActiveTab`, role filtering, and navigation callbacks.

- [ ] **Step 1: Replace green shell styling with semantic ranch classes**

Navbar/sidebar surfaces use canvas, leather, rust, and line tokens; active navigation must use text + border/background, not color alone.

- [ ] **Step 2: Polish original logo without replacing its geometry**

Keep the existing SVG paths and only change the brand palette to leather/parchment/rust.

- [ ] **Step 3: Set Indonesian document language**

```html
<html lang="id">
```

- [ ] **Step 4: Run lint/build and navigation tests**

```bash
npx --yes --package=node@22 -- bash -lc 'npm test -w frontend && npm run lint -w frontend && npm run build -w frontend'
```

Expected: all tests pass, lint/build exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/src/App.tsx frontend/src/components/layout frontend/src/components/brand/SapiPapiLogo.tsx
git commit -m "style: apply ranch identity to app shell"
```

### Task 3: Login editorial ranch treatment

**Files:**
- Modify: `frontend/src/components/auth/LoginPage.tsx`
- Test: existing login/demo-auth tests and browser login smoke test

**Interfaces:**
- Preserves `onLogin(email, password)`, `onDemoLogin()`, and `onOpenCatalog()` exactly.
- Consumes `.ranch-input`, `.ranch-action-primary`, `.ranch-action-secondary`, `.ranch-label`, and ranch color tokens.

- [ ] **Step 1: Recompose the desktop brand panel**

Use one restrained poster frame, an uppercase eyebrow, a serif headline, and a low-opacity desert horizon made from CSS/SVG. Do not add fake metrics or generic marketing sections.

- [ ] **Step 2: Restyle the form as an operational surface**

Use canvas background, leather/rust actions, minimum 44px controls, visible focus states, and unchanged Indonesian copy.

- [ ] **Step 3: Verify login contracts**

```bash
npx --yes --package=node@22 -- bash -lc 'npm test -w frontend -- --run'
```

Expected: demo authentication security tests remain green.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/auth/LoginPage.tsx
git commit -m "style: redesign login with ranch editorial framing"
```

### Task 4: Dashboard and finance hierarchy

**Files:**
- Modify: `frontend/src/components/dashboard/DashboardOverview.tsx`
- Modify: `frontend/src/components/finance/FinanceView.tsx`
- Modify only if required for consistency: `frontend/src/components/expenses/ExpenseManagementView.tsx`
- Modify only if required for consistency: `frontend/src/components/sales-results/SalesResultsView.tsx`

**Interfaces:**
- Finance continues to consume `summarizeFinancePeriod()` unchanged.
- Dashboard continues to consume existing `storeService` data and `onNavigate` callbacks unchanged.

- [ ] **Step 1: Add restrained editorial headers**

Dashboard and finance use `.ranch-label`, `.ranch-heading`, and `.ranch-divider`; no large poster hero is added.

- [ ] **Step 2: Normalize KPI cards**

Use solid canvas surfaces and top accent lines. Positive/negative states must retain icon/label cues in addition to color.

- [ ] **Step 3: Keep dense content neutral**

Tables, period selectors, forms, and modal content use solid backgrounds without texture. Replace legacy emerald/blue styling with leather/olive/teal/rust semantics.

- [ ] **Step 4: Run tests and production build**

```bash
npx --yes --package=node@22 -- bash -lc 'npm test -w frontend -- --run && npm run lint -w frontend && npm run build -w frontend'
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/dashboard/DashboardOverview.tsx frontend/src/components/finance/FinanceView.tsx frontend/src/components/expenses/ExpenseManagementView.tsx frontend/src/components/sales-results/SalesResultsView.tsx
git commit -m "style: refine operational pages for modern ranch theme"
```

### Task 5: Browser QA and project receipt

**Files:**
- Modify: `/home/ubuntu/obsidian-vault/Groups/ternak-monitor/Output Notes.md`
- Modify: `/home/ubuntu/obsidian-vault/Groups/ternak-monitor/Current Focus.md`

**Interfaces:**
- Consumes built application and data-demo login.
- Produces evidence for visual and functional completion.

- [ ] **Step 1: Start local preview with Node 22**

```bash
npx --yes --package=node@22 -- bash -lc 'npm run dev -w frontend -- --host 127.0.0.1'
```

Expected: Vite ready URL.

- [ ] **Step 2: Desktop smoke test**

Verify Login Demo → Dashboard → Pengeluaran → Hasil Penjualan → Laporan Laba Rugi, including month/year switch and browser console errors.

- [ ] **Step 3: Responsive visual test**

Inspect 375px, 768px, 1024px, and 1440px equivalents. Confirm no horizontal overflow, clipped Indonesian labels, obscured controls, or textures behind tables.

- [ ] **Step 4: Final static gate**

```bash
npx --yes --package=node@22 -- bash -lc 'npm test -w frontend -- --run && npm run lint -w frontend && npm run build -w frontend'
git diff --check
git status --short
```

Expected: tests/lint/build/diff check pass; only intended note changes remain uncommitted outside the repo.

- [ ] **Step 5: Record Obsidian receipt**

Document screenshots/routes checked, test count, build status, known limitations, and local commit hashes. Do not claim deploy or mobile-device validation unless actually performed.
