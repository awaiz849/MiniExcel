# CLAUDE.md — Vibe Coding Hackathon (Swayambhu 2K26)

Context: 60-minute timed build at a college hackathon. The problem statement (PS) is given on the spot.
Judges score: a WORKING demo, a REALISTIC PROFESSIONAL UI, ONE memorable feature, and how well I can EXPLAIN the project.
Speed and stability matter more than architecture. I must be able to explain every file.

## Stack (always, unless I say otherwise)
- Vite + React + TypeScript
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin
- lucide-react for icons
- recharts for charts
- framer-motion only for small, cheap animations
- Data: localStorage with seeded sample data on first load. NO backend, NO auth, NO database unless I explicitly ask.
- React Router only if there are 3+ real pages; otherwise use tabs/sections.
- Ask before adding any other library. If one is truly needed (e.g. qrcode.react for QR codes), add it and tell me why.

## Scope rules (important)
- Build ONLY the features I list plus the wow feature. Do not invent extra features.
- At the end, suggest up to 3 extras in one line each. Don't build them unless I say so.
- Prefer a smaller app that fully works over a bigger app with rough edges.
- Keep the code easy to explain: clear names, simple logic, around 10–15 source files max.

## Workflow rules
1. Before writing code, give a SHORT plan (max 12 lines): pages, components, data model, how the wow feature works. Then build immediately.
2. Build the whole working app in one pass.
3. Run `npm run build` and fix every TypeScript/build error before saying you're done.
4. After the build passes, make a git commit automatically ("initial working build").
5. Never break a working feature to add a new one. Small, targeted edits.
6. Keep replies short: what you built, what to test (step by step), known limitations.

## Design direction — must look like a REAL product, not AI-generated
- LIGHT theme by default, generous white space. Dark mode only as an optional toggle.
- NO purple/indigo gradients, NO glowing gradient boxes, NO neon, NO emoji in the UI.
- ONE confident brand colour chosen to fit the PS (e.g. deep navy, teal, emerald, warm orange for food) plus neutral grays.
- Font: one strong sans-serif from Google Fonts (Plus Jakarta Sans, Manrope or Inter). Big bold headings with tight letter-spacing, clear size hierarchy.
- Real-site structure: navbar (logo + 4–5 links + one CTA button) → photo hero (full-width real photo, dark overlay, big headline, one-line subtext, primary + outline buttons) → category/feature cards with images → main content → simple footer.
- Images: use files from `public/images` if they exist. Otherwise use Unsplash photo URLs (images.unsplash.com) that match the topic. Never use images showing another organisation's name or logo.
- Calm details: rounded-xl (not rounded-3xl), light gray borders, subtle shadows, few badges.
- App screens (lists, forms, dashboards) stay functional and clear in the same light style.

## Quality bar (every app)
- Hover and focus states on everything clickable; transitions 150–300ms.
- Toast notifications for actions (add, delete, save).
- Loading states, empty states (icon + helpful message), confirm before delete.
- Form validation with clear inline error messages.
- Fully responsive: works at 375px mobile width, no horizontal scroll, no clipped text in inputs/selects.
- A stats/dashboard section with 3–4 summary cards and one chart wherever it fits the PS.
- Search and filter on any list longer than a few items.

## Sample data
- Seed 8–15 realistic records on first load so the demo never looks empty.
- Indian context: Indian names, ₹ with `en-IN` formatting, dates like 16 Oct 2026, local places (Chhatrapati Sambhajinagar, JNEC, CIDCO, Pune, Mumbai) where relevant.
- A small "Reset demo data" button in the footer.

## Code style
- Functional components + hooks. All data types in `src/types.ts`.
- Keep state simple: useState/useReducer + one small `useLocalStorage` hook. No Redux.
- Suggested structure: `src/components/`, `src/pages/` (if routing), `src/data/seed.ts`, `src/lib/` for helpers.
- No dead code, no commented-out blocks.

## Project explanation (I must be able to explain everything)
When I say "explain" or ask for JUDGE_PREP.md, write in simple spoken English, specific to THIS app:
- Problem + solution, tech stack with WHY for this PS, ASCII architecture, user flows, data model,
- a file-by-file table (what each file does, one line each),
- how the wow feature works, likely judge questions with answers, honest limitations, future scope.

## Commands I will use
- "checkpoint" → `git add -A && git commit -m "<short description>"`
- "rollback" → restore the last commit
- "deploy" → run `npm run build`, then `vercel --prod --yes`, report the live URL. If React Router is used, add `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` first.
