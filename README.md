# CARWISE
Car buying decision intelligence for India, with durable catalogue management and image uploads.

## Run and check
npm install
npm run dev
npm test
npx tsc --noEmit
npm run build

The supplied workspace uses the Next-compatible Vinext Sites runtime, React, TypeScript, Tailwind, shadcn dialog/tabs, Lucide, Recharts and Zod. Customer charts and the detailed scorecard load in separate chunks.

## Admin workflow
Open `/admin` while signed into the private Site.
1. **Template & instructions**: copy or download the version 1 template, or copy the included AI instructions plus template.
2. Complete values with sources. Prices are full INR rupees (`1643000`, not `16.43`). Missing values must remain `null`.
3. **JSON import**: paste a single car, car array, versioned batch or fenced JSON, or upload a `.json` file. Choose Validate & preview.
4. Review additions, matching-ID updates, data modes, prices and publication status. Choose Import to save atomically.
5. **Catalogue → Edit & images**: upload JPEG, PNG or WebP images (8 MB each, 12 per car), set descriptions/credits and primary photo, and save.
6. Publish reviewed drafts. Unpublish is reversible and hides the record from customer pages. Edit JSON updates every specification, feature, source and score. Export catalogue creates a JSON backup including drafts.

A stable car ID controls upsert behavior. Duplicate IDs and brand/model/variant URL collisions are rejected. Unknown fields and invalid units, dates, prices, scores and review evidence return field-level errors. Scores require explanations and sources; missing category scores do not become fake zero-point assessments. Sources are displayed as submitted, not independently verified by CARWISE.

Template: `public/carwise-car-template.json`. Parser and canonical schema: `lib/car-import.ts`. Main scoring categories total exactly 100 possible points.

## Persistence
Catalogue records are stored as validated versioned JSON in D1, with a schema-generated migration. Uploaded bytes are stored in R2; image metadata is kept in D1. The 22 original demo records are a starter catalogue merged with durable overrides. Unpublishing a demo record persists a hidden override. Uploaded images are not stored in browser localStorage or in the source repository.

Private Site access is restricted by the Sites dispatcher. Admin page and APIs additionally require forwarded ChatGPT identity; mutation routes enforce same-origin requests. Do not broaden the Site audience without introducing an explicit editor-role allowlist. Database/R2 failures preserve form inputs and report a recoverable error.

Device-local shortlist, comparisons and calculator preferences remain browser UI preferences. Admin records and uploaded assets survive browser changes and sessions.

## Local storage setup
The hosting manifest declares DB and BUCKET. Generate migrations with `npm run db:generate`, build, then apply each unapplied local SQL file once using Wrangler D1 execute with the generated `dist/server/wrangler.json` and `.wrangler/state` persistence directory. The Sites publication workflow applies the committed SQL migrations to hosted storage. Do not rewrite applied migration files.

## Ownership model
On-road cost includes initial insurance; four annual renewals are added over five years. Fuel/energy, maintenance, renewal insurance and five-year loan interest are summed with purchase price. Principal is not double-counted. Financing defaults are 8.5% over 60 months; interest after year five is excluded. Comparison uses the same running-cost defaults without financing. EV uses km/kWh, CNG uses km/kg, and liquid fuel uses km/l. Inputs are bounded; saved assumptions restore for each car. No resale, inflation, depreciation or time-value assumptions are implied.

## Recommendations
Matching uses ex-showroom budget, fuel, transmission, seating and optional EMI bands (20% down, 8.5%, 60 months). Ranking uses the selected scoring category or annual-distance-aware ownership estimates. Route, parking and frequency preferences are recorded for review; no unsourced suitability metric is inferred.

## Data boundaries
Demo specifications and scores are illustrative. Live price feeds and independently sourced reviews are not connected. Imported records can supply manufacturer, independent, owner, expert, estimate and platform data. Photography initially exists for the Elevate; use admin uploads to complete the rest of the catalogue. No generative assistant is connected; bounded assistant responses use the selected record and explicit cost scenarios.
