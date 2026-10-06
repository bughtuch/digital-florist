# DIGITAL FLORIST

> "A flower that lives in code."

Digital Florist is a global luxury digital gifting house.

A customer chooses a Digital Bloom, writes a short private message, pays a fixed $25, and sends the Bloom privately to another person. The recipient experiences the artwork privately and can later keep it permanently in their BloomVault.

---

## PRODUCT PRINCIPLES

- No public social feed
- No likes, no comments, no follower counts, no public popularity metrics
- No NFT language, no crypto aesthetic
- No conventional ecommerce aesthetic
- No AI-startup aesthetic
- No SaaS cards or dashboard styling on the public site
- Digital Florist curates the Blooms — customers do not generate their own
- Brand line: **"Not for the vase. For the vault."**
- Real physical flowers are the original source material for House Blooms
- AI is a studio technique, never the public product proposition
- The experience must feel like an international fashion house + contemporary art gallery + private ritual

---

## LAUNCH CITIES

| City | Code |
|------|------|
| London | LON |
| Dubai | DXB |
| Milano | MIL |
| Seoul | SEL |
| Tokyo | TYO |
| New York | NYC |

---

## PRICING ARCHITECTURE

- Pricing is local: each Bloom has a `price_minor` (integer) and `currency` stored in the DB.
- `price_minor` is always the smallest currency unit (pence, cents, fils, yen, won).
- Zero-decimal currencies (JPY, KRW): `price_minor` equals the display amount (no divide by 100).
- Standard currencies (GBP, EUR, USD, AED): `price_minor` / 100 = display amount.
- Default city currencies: LON→GBP, DXB→AED, MIL→EUR, SEL→KRW, TYO→JPY, NYC→USD.
- Never hardcode price or currency in UI — always read from `price_minor` + `currency`.
- Use `formatPrice(minor, currency, locale)` from `@/lib/currency` for display.
- Use `parseInputToMinor(input, currency)` for Studio price entry.

---

## LAUNCH LANGUAGES

| Language | Code | Direction |
|----------|------|-----------|
| English | en | LTR |
| Arabic | ar | RTL |
| Italian | it | LTR |
| Korean | ko | LTR |
| Japanese | ja | LTR |

Language and city are independent. Arabic must support genuine RTL layout (not just `direction: rtl` on body — full structural flip).

---

## HOUSE COLLECTIONS

AFTERHOURS / MORNING / MEMORY / RITUAL / CITY

---

## CORE PRODUCT OBJECTS (FUTURE)

- Digital Bloom
- BloomVault
- City Receipt
- House Archive
- Digital Florist Studio

---

## CUSTOMER FLOW (FUTURE)

```
CHOOSE → WRITE → RECIPIENT → PAY → SENT → REVEAL → KEEP IN VAULT
```

Maximum private message length: approximately 320 characters.

---

## VISUAL RULES

- The website is essentially black. Not generic "dark mode" — **fashion black**.
- The flower provides most of the colour. The shell is near-black neutral.
- Typography is editorial.
- Artwork is huge.
- Metadata is tiny.
- Negative space is generous.
- Motion is extremely slow and restrained.
- **Avoid:** gradients, glowing buttons, obvious rounded SaaS cards, star ratings, discount badges, testimonial sliders, generic ecommerce components.

### Design Tokens
- Background: `#080706` (near-black, slightly warm)
- Surface: `#0d0c0b`
- Border: `#1a1917` (hairline)
- Text primary: `#f2ede8` (warm off-white)
- Text secondary: `#6b6560` (muted neutral grey)
- Text tertiary: `#3d3a37` (very muted)
- Accent: none globally — artwork provides colour

### Typography
- Display / wordmark: Cormorant Garamond (Google Fonts, variable)
- UI / metadata: Inter (Google Fonts, variable)
- Arabic display: Noto Naskh Arabic (Google Fonts)
- Character: severe, elegant, contemporary — NOT decorative, NOT friendly

### Spacing
- Very generous. Use viewport scale deliberately.
- Avoid cramming content above the fold.

### Corners
- Generally square or nearly square. No large SaaS rounded corners.

### Animation
- Very restrained. No bounce. No spring. No excessive fade-ins. No scroll-jacking.
- Respect `prefers-reduced-motion`.

---

## THE STANDARD

> It must feel like a £500k international cultural/fashion website, not a web template.

---

## TECH STACK

- Next.js (App Router, latest stable)
- TypeScript
- Tailwind CSS v4
- next-intl (i18n, App Router integration)
- `src/` directory
- `@/*` import alias

### Locale Routing

```
/en  /ar  /it  /ko  /ja
```

Root `/` redirects to `/en`.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Never commit secrets. `.env.local` is gitignored.

---

## BUILD HISTORY

### Build 01 — Foundation + Global Shell + Homepage
- Next.js App Router + TypeScript + Tailwind v4
- next-intl locale routing for all 5 languages
- RTL support for Arabic
- Homepage sections: Hero, City Strip, Manifesto, Permanence, How It Works, City Origins, Final CTA
- Global Header + Footer
- Supabase client structure (no schema, no calls)
- No Stripe, no auth, no BloomVault, no checkout

### Build 02 — (planned)
- Gallery page with Bloom grid
- Individual Bloom page
- Supabase schema: blooms, collections, editions

### Build 03 — (planned)
- Stripe checkout ($25 fixed)
- Recipient delivery flow
- Private message (320 char)

### Build 04 — (planned)
- BloomVault (authenticated)
- Supabase auth
- Reveal experience

### Build 05 — (planned)
- City Receipt
- House Archive
- Studio (admin, internal)
