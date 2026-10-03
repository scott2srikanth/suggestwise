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

## Admin authenticator access
The `/admin` page and every catalogue/image write API require a 30-minute server-backed admin session established with a six-digit Google Authenticator TOTP. First enrollment is available only behind the existing owner-private Sites boundary; the enrolled site user becomes the sole administrator. Keep that boundary private during enrollment. Public hosting changes require reviewing authorization separately.

Open `/admin`, start setup, add the displayed key as a Time based entry named CARWISE Admin in Google Authenticator, then verify one code. Pending setup expires in 10 minutes. The setup key is never sent to a third-party QR service. Secrets are AES-GCM encrypted using the secret runtime variable `ADMIN_TOTP_ENCRYPTION_KEY`; sessions use random HttpOnly/SameSite=Strict cookies (Secure on HTTPS), only their SHA-256 hashes are stored, and codes cannot be replayed. Five verification attempts per five-minute window are allowed. Lock admin revokes the current session. No password, email-code, or recovery-code login fallback is provided. Keep the setup key securely or transfer the authenticator before replacing your phone; loss requires an authorized server-side reset. Do not rotate the encryption key without an explicit migration of enrolled secrets. Local testing needs an independently generated 32-byte hex key in the local Worker environment, never the production key.

## Browser-local decision engine
Open `/decision-engine` from the navigation or Find My Car. The engine is inspired by TypeSafe's System One decomposition of atomic questions into typed outputs. It is **not Jev, a trained model, or a calibrated probability model**. No TypeSafe API is used and no preference request is sent to an AI service. The customer catalogue is fetched as before; evaluation and report export happen in browser memory.

`lib/decision-engine.ts` is a pure, Zod-validated decision function. It emits a versioned report with `choice`, per-car `action`, pass/fail/unknown constraint checks, evidence labels, weighted score factors, conservative uncertainty bounds, and explicit cost assumptions. Failed constraints exclude a car. Unknown constraints, missing weighted scores, and demo data require review. Remaining fully sourced matches are eligible for comparison, not automatically approved for purchase. Eligible candidates sort before review candidates, then by the lower score bound, then ID for stable ties. Ten raw priority weights normalize to 100%; missing categories use the full 0–10 interval rather than being removed from the denominator. Displayed factor contributions are rounded. Score coverage is weighted data availability, never an accuracy probability.

Independent safety evidence only passes the optional requirement when the NCAP field has an independent source label and a populated value; that label is not an external verification. Feature requirements mean standard equipment on the exact variant; optional equipment fails and unknown availability requests review. Missing on-road prices may use the existing city multiplier only when the user permits estimates. Evidence dates older than 180 days on active constraints are flagged. Fuel expenses use route-weighted consumption (city fraction / city efficiency + highway fraction / highway efficiency); mixed real-world data is a labelled fallback. No claimed mileage or cross-powertrain efficiency number is substituted. Ownership totals require real-world efficiency, purchase price, maintenance and insurance; otherwise they remain unavailable. Fuel prices are editable scenario assumptions.

UI lives in `app/decision-engine.tsx`, loaded lazily by the app shell. It supports scenario inputs, priority presets/sliders, trace expansion, excluded-car inspection, shortlist/compare actions, and local JSON report download. Engine tests cover strict input validation, constraints, missing data, standard features, safety provenance, demo abstention, cost arithmetic and stable ranking. The provider-free typed contract can later accept model judgments via a separately authorized integration, but no calibrated confidence should be added without validating a real model.

## Mira: talking decision guide
The Decision Engine includes Mira, an original generated character connected directly to the current typed decision report. Six bounded explanation topics cover the shortlist, why a selected car appears, trade-offs, cost, safety and comparison of the first two results. Customers can select a candidate and ask a supported typed question. This is a data-grounded template narrator, not an unrestricted conversational language model. Unsupported topics abstain; no specifications, review quotes, NCAP scores, probabilities or cost inputs are invented. Preference changes refresh the explanation and cancel playback.

Voice uses browser SpeechSynthesis with installed **device-local English voices only**, preferring en-IN, then a local English fallback. Playback is customer initiated and provides pause, resume, stop, adjustable rate and a readable chunk-highlighted transcript. Voice availability and naturalness depend on browser/device installation; no bespoke trained voice or cloud TTS account is claimed. Remote voices are filtered out. No microphone permission is requested, and narration text is not sent to a speech API. Missing voice/browser support shows an actionable transcript fallback. The character uses speaking-state waveform/halo animation, not phoneme-based lip synchronization; reduced-motion settings are respected.

`lib/guide-narration.ts` creates explanations from report values, resolves supported question intents, chunks speech and selects voices. `app/talking-guide.tsx` owns the speech lifecycle and accessible interface. Cancellation invalidates stale callbacks; playback ends on navigation or data changes. Tests verify missing evidence, topic boundaries, demo caveats, score intervals, chunk preservation and local Indian-English preference.

Character asset: `public/mira-guide.png`, generated with the built-in image-generation tool. Final prompt: original premium stylized 3D portrait of Mira, an approachable Indian woman automotive advisor around 30, shoulder-length dark hair, navy smart-casual jacket over electric-blue shirt, small golden pin, warm confident expression, front-facing upper torso, isolated transparent background, gentle studio lighting, no logos, text or watermark.
