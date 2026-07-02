# JDT-17-LOYALTY — Stitch AI UI Design Brief

> **Platform:** Points-based loyalty system with KFC and McDonald's as partner merchants.
> **Core capabilities:** Point earning, redemption against rewards, and cross-partner point exchange.
> **Target:** Mobile-first consumer app (screens 1–6) + desktop CMS for admins (screens 7–8).

---

## Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--brand-primary` | `#E8620A` | Primary CTAs, active states, loyalty "warmth" |
| `--brand-primary-dark` | `#B84C06` | Pressed/hover state of primary |
| `--brand-primary-light` | `#FDE8D8` | Tinted backgrounds, highlight chips |
| `--neutral-900` | `#1A1A1A` | Primary text |
| `--neutral-700` | `#4A4A4A` | Secondary text, labels |
| `--neutral-400` | `#9E9E9E` | Placeholder text, disabled |
| `--neutral-100` | `#F5F5F5` | Page background |
| `--neutral-0` | `#FFFFFF` | Card surface |
| `--success` | `#2E7D32` | EARN badge, success toasts |
| `--success-light` | `#E8F5E9` | EARN badge background |
| `--error` | `#C62828` | Error states, destructive actions |
| `--error-light` | `#FFEBEE` | Error message backgrounds |
| `--warning` | `#F57F17` | Exchange warnings, rate notices |
| `--partner-kfc` | `#C8102E` | KFC brand accent (badge dot, card border) |
| `--partner-mcd` | `#FFC72C` | McDonald's brand accent |

### Typography

- **Font family:** `Inter` (Google Fonts) — clean, legible at small sizes.
- **Scale:**
  - `display`: 28px / 700 — hero balance numbers
  - `h1`: 22px / 700 — screen titles
  - `h2`: 18px / 600 — section headings, card titles
  - `body`: 15px / 400 — body copy, list items
  - `caption`: 12px / 400 — timestamps, subtitles
  - `label`: 13px / 600 — badges, button labels

### Key Component Patterns

- **Card:** White surface, `border-radius: 16px`, subtle shadow (`0 2px 8px rgba(0,0,0,0.08)`). Used for reward items, balance tiles.
- **Bottom Sheet / Modal:** Slides up from bottom edge (mobile). Used for redemption confirmation and exchange preview. Backdrop overlay `rgba(0,0,0,0.4)`. Drag handle indicator at top.
- **Tab Bar (Mobile App):** Fixed bottom navigation, 4 tabs: Home · Rewards · Exchange · History. Active tab uses `--brand-primary` icon + label. Inactive tabs use `--neutral-400`.
- **Sidebar (CMS/Desktop):** Fixed left sidebar 240px wide, dark (`--neutral-900` bg), icon + label nav items.
- **Partner Badge / Chip:** Small pill with partner brand color dot + partner name. `border-radius: 99px`, `font: label`.
- **Type Badge (Transactions):** Colored pill — EARN (success green), REDEEM (brand orange), EXCHANGE (neutral blue `#1565C0` / `#E3F2FD` bg).
- **Skeleton Loaders:** Use shimmering gray bars (`--neutral-100` → `--neutral-400` animation) for all loading states.
- **Primary Button:** Full-width on mobile, `--brand-primary` fill, white label, `border-radius: 12px`, height 52px.
- **Secondary Button:** Outlined, `--brand-primary` border and label, transparent fill.
- **Status Badge (CMS):** `ACTIVE` = success green, `INACTIVE` = `--neutral-400` gray, `SUSPENDED` = error red.

---

## Screen 1: Member Registration

**Purpose:** Collect basic member information to create a new loyalty account.
**Viewport:** Mobile-first (375px wide reference)

### Key Elements (top → bottom priority)

1. **App logo / wordmark** — Centered at top, small lockup with platform name "LoyaltyHub" (placeholder) and tagline "Earn more, every bite."
2. **Screen title** — "Create Account", `h1`, left-aligned below logo area.
3. **Full Name field** — Text input, label "Full Name", placeholder "e.g. Budi Santoso". Maps to `memberName`.
4. **Email field** — Email input, label "Email Address", placeholder "you@email.com". Keyboard type: email.
5. **Phone Number field** — Tel input with country code prefix `+62` (Indonesia). Label "Phone Number".
6. **Password field** — Masked text input, label "Password", with show/hide toggle icon (eye icon).
7. **Confirm Password field** — Masked text input, label "Confirm Password".
8. **Terms & Conditions checkbox** — Small checkbox row: "I agree to the [Terms of Service] and [Privacy Policy]" with tappable underlined links.
9. **Register CTA button** — Full-width primary button "Create Account".
10. **Login redirect** — Caption text below button: "Already have an account? [Sign In]"

### Primary Action(s) / CTA

- **"Create Account"** → Submits form via `POST /members`; on success navigates to Member Home (Screen 2).
- **"Sign In"** (link) → Navigates to login screen (out of scope but stub the link).

### States

- **Empty:** All fields blank; "Create Account" button is disabled (grayed out, 50% opacity).
- **Loading:** Button shows a spinner replacing the label text; all fields are non-interactive.
- **Error (field-level):** Red underline on invalid field + error caption below (e.g., "Passwords do not match"). General API error shows an inline error banner at top of form (red background, error icon, message text).
- **Success:** Brief success toast at bottom ("Account created! Welcome, Budi 🎉"), then auto-navigate to Home.

### Design Notes

- Wrap the form in a white card that extends nearly full screen on mobile with top rounded corners (treat it like a bottom sheet anchored to the bottom of a branded header area).
- The header area behind the logo can use a warm gradient: `--brand-primary` → `--brand-primary-dark`.
- Use Inter 15px / 400 for input labels and 15px / 600 for field values.
- Inputs use `border-radius: 10px`, border `1.5px solid --neutral-200`, focused state border `--brand-primary`.

---

## Screen 2: Member Home / Dashboard

**Purpose:** Show the member's multi-partner point balances and surface quick navigation to key actions.
**Viewport:** Mobile-first (375px wide reference)

### Key Elements (top → bottom priority)

1. **Top app bar** — Logo left, member avatar/initials circle right. Background transparent over hero.
2. **Hero / greeting section** — Warm gradient background (`--brand-primary` → `#F4A261`). Text: "Good morning, Budi 👋" (`h2`, white) + subtitle "Here's your points balance."
3. **Balance Cards row** — Horizontal scroll row of per-partner balance tiles. Each tile:
   - Partner logo (KFC / McDonald's icon placeholder)
   - Partner name (`caption`, white/light)
   - Balance number (large `display` weight, white) + "pts" unit label
   - Partner brand color as card background tint or left border accent (`--partner-kfc` / `--partner-mcd`)
   - Data source: `GET /members/{id}/points` → `balances[]`
4. **Quick Actions grid** — 2×2 icon-button grid (or horizontal row of 3):
   - 🎁 "Redeem" → navigates to Reward Catalog (Screen 3)
   - 🔄 "Exchange" → navigates to Point Exchange (Screen 5)
   - 📋 "History" → navigates to Transaction History (Screen 6)
   - (Optional 4th) 👤 "Profile" → member profile screen (stub)
5. **Recent Transactions section** — Section heading "Recent Activity". Shows last 3 transactions from `GET /members/{id}/transactions`. Each row:
   - Transaction type badge (EARN / REDEEM / EXCHANGE_OUT / EXCHANGE_IN)
   - Partner name + description
   - Points delta (green `+150 pts` for EARN, red `-100 pts` for EXCHANGE_OUT)
   - Date (`caption`)
6. **"View All" link** — Caption-size link below recent list → navigates to Transaction History.

### Primary Action(s) / CTA

- **"Redeem"** → navigates to Reward Catalog (Screen 3).
- **"Exchange"** → navigates to Point Exchange (Screen 5).
- **"History"** → navigates to Transaction History (Screen 6).

### States

- **Empty (no transactions):** Replace recent list with an illustration + "No activity yet. Start earning points!" copy.
- **Loading:** Skeleton loaders for balance cards (rectangular shimmers) and transaction rows (line shimmers).
- **Error:** Inline error card replacing balance area: error icon + "Couldn't load your points. [Retry]" link.
- **Success (post-action return):** Brief bottom toast confirming last completed action (e.g., "Redemption successful! -300 pts").

### Design Notes

- Balance cards should have a min-width of ~150px and be horizontally scrollable if more than 2 partners.
- Use the partner brand color as a 4px left border accent on each balance card (KFC: `#C8102E`, McD: `#FFC72C`).
- Quick Actions use outlined circular icon buttons (48px diameter), icon in `--brand-primary`, label in `--neutral-700` below.
- Bottom Tab Bar: Home · Rewards · Exchange · History (fixed, white background, shadow top).

---

## Screen 3: Reward Catalog

**Purpose:** Display all available rewards across partner merchants so members can browse and select one to redeem.
**Viewport:** Mobile-first (375px wide reference)

### Key Elements (top → bottom priority)

1. **Screen title bar** — "Rewards" (`h1`), back chevron left (if navigated from Home).
2. **Partner filter chips** — Horizontal scrollable chip row: "All" · "KFC" · "McDonald's". Active chip uses `--brand-primary` fill, white label. Inactive chips use outlined style. Filters the grid below.
3. **Search bar (optional / nice-to-have)** — Rounded search input with magnifier icon. Placeholder "Search rewards…".
4. **Reward card grid** — 2-column card grid. Each reward card:
   - Reward image placeholder (icon or branded illustration area, 16:9 aspect ratio top section)
   - Partner badge chip (e.g., "KFC" with `--partner-kfc` dot)
   - Reward name (`h2`): e.g., "KFC Original Bucket"
   - Point cost row: coin icon + "500 pts" in `--brand-primary` bold
   - "Redeem" secondary button (outlined, full card width)
   - Data source: `GET /rewards` → `data[]` filtered by selected partner chip
5. **My Points mini-bar** — Sticky bar at bottom above tab bar: "Your KFC Points: 350 pts | McD Points: 120 pts". Updates based on active filter chip partner.

### Primary Action(s) / CTA

- **"Redeem" (on any card)** → Navigates to Reward Redemption Confirm (Screen 4) with that reward's data.
- **Partner filter chips** → Filter the card grid client-side by `partnerName`.

### States

- **Empty (no rewards for filter):** Center illustration + "No rewards available for this partner yet."
- **Loading:** Skeleton loaders — 4 card-shaped shimmer placeholders in 2-column grid.
- **Error:** Full-screen inline error state: error icon, "Couldn't load rewards. [Try again]".
- **Insufficient points:** The "Redeem" button on a card shows as disabled (grayed) with tooltip/caption "Not enough points" if the member's balance for that partner is below `pointCost`.

### Design Notes

- Card `border-radius: 16px`, white background, subtle shadow.
- The image area can use a soft gradient placeholder using the partner's brand color at 20% opacity.
- Partner filter chips: `border-radius: 99px`, height 36px, `Inter 13px / 600`.
- Coin icon for points: use a simple circular coin emoji or SF Symbol-style icon in `--brand-primary`.
- The "My Points mini-bar" uses a frosted-glass style background (white 80% opacity with `backdrop-filter: blur(8px)`).

---

## Screen 4: Reward Redemption Confirm

**Purpose:** Show full details of the selected reward and ask the member to confirm or cancel the redemption.
**Viewport:** Mobile-first (375px wide reference) — presented as a **Bottom Sheet** sliding up over Screen 3.

### Key Elements (top → bottom priority)

1. **Bottom sheet drag handle** — Centered gray pill at top of sheet.
2. **Sheet title** — "Confirm Redemption" (`h2`, centered).
3. **Reward image** — Large hero image or branded illustration placeholder (~200px tall, `border-radius: 12px`).
4. **Reward name** — `h1` sized, e.g., "KFC Original Bucket".
5. **Partner badge** — Partner chip with brand color dot.
6. **Point cost row** — Coin icon + "500 pts" (`display`-sized, `--brand-primary`). Below it, updated balance preview: "Your KFC balance after redemption: **−150 pts → 0 pts**" (`caption`, `--neutral-700`). *(Wait — member has 350 pts and cost is 500 pts; this scenario would be blocked by disabled state on Screen 3. Balance preview shows: "Remaining: 350 − 500 = …" — Stitch should design both sufficient and insufficient states.)*
7. **Divider line** — Thin `--neutral-200` horizontal rule.
8. **Current balance row** — Label: "Your KFC Points" + value: "350 pts".
9. **Cost row** — Label: "Redemption Cost" + value: "−500 pts" (in `--error`).
10. **Remaining balance row** — Label: "After Redemption" + value: "**−150 pts**" (red, disabled CTA state shown if negative).
11. **Confirm button** — Full-width primary "Confirm Redemption". Disabled + tooltip if balance insufficient.
12. **Cancel link** — Centered text link "Cancel" below button.

### Primary Action(s) / CTA

- **"Confirm Redemption"** → `POST /redemptions` (out of scope in current TSD — treat as stub); on success, show success state and dismiss sheet.
- **"Cancel"** → Dismisses bottom sheet, returns to Reward Catalog.

### States

- **Loading (submitting):** Confirm button shows spinner, sheet non-interactive.
- **Error:** Inline error banner inside sheet top: "Redemption failed. Please try again."
- **Success:** Sheet transitions to a success state — green checkmark animation, "Redemption Successful! 🎉", reward name, and "Done" button to dismiss.
- **Insufficient balance:** Confirm button disabled, a warning banner: "You need 150 more KFC points to redeem this reward."

### Design Notes

- Bottom sheet covers ~85% of screen height with a backdrop overlay.
- Use a bold `--brand-primary` color for the point cost number to make it visually striking.
- The balance breakdown (current / cost / remaining) should be in a subtle rounded box (`--neutral-100` background) to group them visually.
- Success animation: use a large animated checkmark (Lottie-style suggestion) in `--success` green.

---

## Screen 5: Point Exchange

**Purpose:** Allow a member to convert points from one partner to another at the platform exchange rate.
**Viewport:** Mobile-first (375px wide reference)

### Key Elements (top → bottom priority)

1. **Screen title bar** — "Exchange Points" (`h1`), back chevron.
2. **From Partner selector** — Card-style selector: label "From", dropdown/picker showing partner name + current balance. E.g., "KFC — 350 pts". Partner badge with `--partner-kfc` accent.
3. **Points amount input** — Large centered numeric input. Label "Points to Exchange". Placeholder "0". Below: caption "Available: 350 pts". Keyboard type: numeric.
4. **Swap / arrow icon** — A circular icon button with two-arrow swap icon between From and To selectors. Tapping swaps the two partners.
5. **To Partner selector** — Card-style selector: label "To", shows target partner name + current balance. E.g., "McDonald's — 120 pts".
6. **Exchange Rate notice** — Info chip: "Exchange rate: 1 KFC pt = 0.8 McD pts" (sourced from `POST /exchange` response `exchangeRate`; pre-fetch on partner selection or display as known constant).
7. **Preview panel** — Visible after user enters an amount. Shows:
   - "You send: **100 KFC pts**"
   - "You receive: **80 McD pts**"
   - "New KFC balance: **250 pts**"
   - "New McD balance: **200 pts**"
   - Data source: previewed from `POST /exchange` response or client-side calculation using `exchangeRate`.
8. **Confirm Exchange button** — Full-width primary "Confirm Exchange". Disabled until valid amount entered and From ≠ To.

### Primary Action(s) / CTA

- **"Confirm Exchange"** → Calls `POST /exchange` with `{ fromPartnerId, toPartnerId, points }`; on success shows success bottom sheet overlay.
- **Swap icon** → Swaps `fromPartner` and `toPartner` fields and recalculates preview.

### States

- **Empty / initial:** Preview panel hidden; Confirm button disabled.
- **Partial input:** Preview panel shows real-time calculation as user types (debounced 300ms).
- **Loading (submitting):** Button spinner; all inputs locked.
- **Error — insufficient points:** Preview panel shows red warning "Insufficient KFC points. You have 350, need X."
- **Error — same partner:** Inline validation: "From and To partners must be different."
- **Error — API failure:** Toast at bottom: "Exchange failed. Please try again."
- **Success:** Bottom sheet overlay with animated coin-transfer illustration, "Exchange Complete!", updated balances shown. "Done" button dismisses and refreshes Home balances.

### Design Notes

- The From/To selectors should look like card tiles with a clear partner logo/color accent and balance displayed.
- The swap button sits centered between the two selector cards — use a circular button with a prominent swap icon.
- The preview panel uses a slightly elevated card (`--neutral-0`, shadow) to visually separate it from the input area.
- Exchange rate notice uses an info icon (`ℹ️` or outlined info circle) with `--warning` color for visibility.
- Animate the preview panel appearing/disappearing with a smooth fade + slide-up (200ms ease).

---

## Screen 6: Transaction History

**Purpose:** Give members a full, scrollable log of their point earning, redemption, and exchange activity.
**Viewport:** Mobile-first (375px wide reference)

### Key Elements (top → bottom priority)

1. **Screen title bar** — "History" (`h1`), back chevron.
2. **Filter chips row** — Horizontal scroll: "All" · "EARN" · "REDEEM" · "EXCHANGE". Active chip uses `--brand-primary` fill.
3. **Transaction list** — Scrollable vertical list. Each list item (row card):
   - **Type badge** — Pill badge:
     - `EARN` → green (`--success` / `--success-light`)
     - `REDEEM` → orange (`--brand-primary` / `--brand-primary-light`)
     - `EXCHANGE_OUT` → blue (`#1565C0` / `#E3F2FD`)
     - `EXCHANGE_IN` → indigo accent
   - **Partner name** — `body`, `--neutral-900`. E.g., "KFC"
   - **Description** — `caption`, `--neutral-700`. E.g., "Purchase — Rp 150,000" for EARN; "KFC → McDonald's" for EXCHANGE.
   - **Points delta** — Right-aligned: `+150 pts` in `--success` for EARN; `−100 pts` in `--error` for EXCHANGE_OUT/REDEEM.
   - **Date/time** — `caption`, `--neutral-400`. e.g., "2 Jul 2026, 14:32"
   - Data source: `GET /members/{id}/transactions` paginated response.
4. **Load more / pagination** — "Load more" button at list bottom, or auto infinite scroll trigger.
5. **Empty state illustration** — Centered when no transactions match filter.

### Primary Action(s) / CTA

- **Filter chips** → Client-side filter (or re-query) the transaction list by `type`.
- **"Load more"** → Fetches next page from `GET /members/{id}/transactions?page=N`.

### States

- **Empty:** Friendly illustration + "No transactions yet. Start earning points at KFC or McDonald's!"
- **Loading (initial):** 5–6 shimmer skeleton rows.
- **Loading (load more):** Spinner at list bottom while fetching next page.
- **Error:** Inline error banner at top of list + retry button.

### Design Notes

- Row items have a subtle divider (`1px solid --neutral-100`) between them, not a full card border — keeps the list lightweight.
- The type badge is the primary visual anchor of each row — make it distinct and easy to scan.
- Points delta text uses `Inter 15px / 700` for weight emphasis.
- Consider grouping transactions by date (sticky date headers e.g., "Today", "Yesterday", "28 Jun 2026") for better scannability.
- `trxAmountIDR` (from EARN transactions) should be formatted as Indonesian Rupiah: `Rp 150.000`.

---

## Screen 7: CMS — Member List

**Purpose:** Allow admins to view and search all registered members with their status at a glance.
**Viewport:** Desktop (1280px wide reference)

### Key Elements (top → bottom priority / left → right for desktop)

1. **Sidebar navigation** — Fixed left, 240px. Dark background (`--neutral-900`). Nav items: Dashboard · Members (active) · Rewards · Transactions · Settings. Active item highlighted with `--brand-primary` left border + lighter background.
2. **Top header bar** — Right side of sidebar: Page title "Members" (`h1`), breadcrumb "Admin > Members".
3. **Toolbar row** — Horizontal row containing:
   - Search input (left): "Search by name, email, phone…" with magnifier icon.
   - Status filter dropdown (middle): "All Statuses" · "ACTIVE" · "INACTIVE" · "SUSPENDED".
   - "Export CSV" button (right, secondary/outlined).
   - "Add Member" button (right, primary orange).
4. **Members table** — Full-width data table with columns:
   - **#** — Row number
   - **Member Name** — Clickable link → navigates to Member Detail (Screen 8)
   - **Email**
   - **Phone**
   - **Registered Date** — formatted as `DD MMM YYYY`
   - **Status** — Status badge: ACTIVE (green), INACTIVE (gray), SUSPENDED (red)
   - **Actions** — Icon buttons: Edit (pencil) · View (eye). Edit → Screen 8.
   - Data source: `GET /members` (admin endpoint, paginated).
5. **Pagination controls** — Bottom of table: page size selector (10 / 25 / 50), prev/next arrows, current page indicator "Showing 1–10 of 243 members".

### Primary Action(s) / CTA

- **Member name link / View icon** → Navigates to Member Detail (Screen 8, view mode).
- **Edit icon** → Navigates to Member Detail (Screen 8, edit mode).
- **"Add Member"** → Opens a modal/drawer to create a new member (or navigates to Screen 1 registration form in admin mode).
- **Search / filter** → Filters table results in real time (debounced) or on submit.

### States

- **Empty (no results for search):** Table body replaced with "No members found matching your search."
- **Loading:** Table rows replaced with skeleton shimmer rows (6–8 rows of gray bars).
- **Error:** Inline error banner above table.

### Design Notes

- Use a clean, minimal data table — white rows, `--neutral-100` alternating row background (zebra striping), `1px solid --neutral-200` row borders.
- Column headers use `Inter 13px / 600`, `--neutral-700` color, with sort arrow icons (ascending/descending indicator).
- Status badges are pill-shaped, same style as mobile type badges.
- The sidebar brand area at top shows platform logo + "Admin Panel" label.
- Table header is sticky on vertical scroll.
- Responsive consideration: at 768px collapse sidebar to icon-only mode.

---

## Screen 8: CMS — Member Detail / Edit

**Purpose:** Allow admins to view full member details, edit their information, and toggle their account status.
**Viewport:** Desktop (1280px wide reference)

### Key Elements (top → bottom priority / left → right for desktop)

1. **Sidebar navigation** — Same as Screen 7. "Members" remains active.
2. **Page header** — Breadcrumb: "Admin > Members > Budi Santoso". Page title: member name (`h1`). Status badge inline with title. Edit toggle button top-right: "Edit" (pencil icon, secondary button) → switches form to editable mode. In edit mode becomes "Save Changes" (primary) + "Cancel" (link).
3. **Two-column layout (desktop):**
   - **Left column (60%):** Member Info Form
     - Full Name (text field)
     - Email (email field)
     - Phone Number (tel field)
     - Member ID (read-only text, monospace font, copy-to-clipboard icon)
     - Registered Date (read-only)
     - Last Activity Date (read-only)
   - **Right column (40%):** Point Balances Card + Status Card
     - **Point Balances card:** Shows current balances per partner (same data as `GET /members/{id}/points`). Each partner row: partner badge + balance. Optionally an "Adjust Points" admin action (stub).
     - **Account Status card:** Current status badge. "Change Status" dropdown or radio buttons: ACTIVE / INACTIVE / SUSPENDED. "Apply" button.
4. **Transaction History tab / section** — Below the two-column area: a condensed version of Screen 6's transaction list (last 10 transactions), with a "View All Transactions" link.
5. **Danger Zone section** — Collapsible panel at page bottom. "Delete Member Account" — outlined red destructive button with confirmation modal.

### Primary Action(s) / CTA

- **"Edit" button** → Switches form fields from read-only to editable inputs.
- **"Save Changes"** → `PUT /members/{id}` with updated fields; success toast "Member updated successfully."
- **"Apply" (status change)** → `PATCH /members/{id}/status`; updates status badge immediately.
- **"Cancel"** → Reverts form to read-only without saving.
- **"Delete Member Account"** → Opens confirmation modal ("Are you sure? This cannot be undone.") → `DELETE /members/{id}`.

### States

- **View mode:** All fields displayed as read-only text (not input boxes — display as label/value pairs for cleanliness).
- **Edit mode:** Fields switch to interactive inputs with `--brand-primary` focus ring.
- **Loading (save):** Save button shows spinner; form non-interactive.
- **Success (save):** Green toast top-right: "✓ Member updated successfully." Form returns to view mode.
- **Error (save):** Red toast or inline field errors for validation failures.
- **Confirm delete modal:** Dark overlay, warning icon, member name in bold, "Delete" (red primary) + "Keep Account" (secondary) buttons.

### Design Notes

- In view mode, fields render as `label: value` pairs with the label in `Inter 13px / 600 / --neutral-700` and value in `Inter 15px / 400 / --neutral-900`.
- The status card on the right uses a bordered card with the status badge prominently displayed at top.
- Use `border-radius: 12px` cards for both right-column cards with a thin `1.5px solid --neutral-200` border.
- The Member ID field should use a monospace font (`font-family: 'JetBrains Mono', monospace`) with a copy icon for UX convenience.
- Destructive actions (delete) should always require a two-step confirmation — first button click reveals a modal, not direct action.
- Toast notifications appear top-right (desktop) with auto-dismiss after 4 seconds.

---

*End of Design Brief — 8 screens covered (6 mobile-first consumer app + 2 desktop CMS)*
