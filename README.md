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
The Decision Engine includes Mira, a customized 3D presenter connected directly to the current typed decision report. Six bounded explanation topics cover the shortlist, why a selected car appears, trade-offs, cost, safety and comparison of the first two results. Customers can select a candidate and ask a supported typed question. This is a data-grounded template narrator, not an unrestricted conversational language model. Unsupported topics abstain; no specifications, review quotes, NCAP scores, probabilities or cost inputs are invented. Preference changes refresh the explanation and cancel playback.

### Mira local neural speech (no key)
Mira uses one Kokoro 82M Heart female English voice through HeadTTS 1.3.0 in a module worker. The q8 timestamped weights are about 92 MB; runtime/assets add to the first-use download. Both speech generation and typed CARWISE decision/narration logic run in the browser. No hosted speech endpoints, provider keys, remote inference, telemetry or microphone access remain. Public model/runtime files download from Hugging Face / pinned jsDelivr; Transformers.js uses browser caching for supported files. Online first-run downloads are required; cache eviction may trigger downloads again. The whole application is not an offline PWA.

Heart uses an American English accent. Upbeat/reassuring/calm delivery modifies pacing and pauses, not a trained emotion-control model. The Decision Engine remains transparent deterministic typed rules inspired by System One; it is not actual Jev or newly trained AI. Generated phoneme durations drive smoothly blended 3D facial targets using the actual audio playback clock, including silence, pause, stop, errors and cancellation.

Local vendor assets are copied by `scripts/prepare-local-voice.mjs`; dependencies and licences are retained. HeadTTS MIT; Kokoro and Transformers.js Apache 2.0. Runtime code is lazy-loaded on Listen, inference uses WASM for device coverage, and downloads show progress. Long explanations are streamed by chunks to avoid waiting for the whole narration.

The earlier generated portrait remains a labelled fallback when WebGL is unavailable; raster mouth-pose switching is no longer used.

Validation: 33 automated checks pass; TypeScript and production build checked. Browser preview verified a real q8 model download (92 MB), actual neural audio playback, phoneme-driven avatar pose changes, pause closing lips, resume restoring movement, and transcript fallback. Additional checks verify anatomically bounded hand reach, expressive delivery and audio-energy-based lip articulation. Voice naturalness is subjective; no dedicated emotional fine-tuning or Indian accent is claimed.


### Mira professional 3D motion
The six raster pose switches have been replaced by an optimized CC0 MPFB full-body rig from met4citizen/TalkingHead. CARWISE customizes navy wardrobe, skin/hair material treatment, studio lights and upper-body/mobile framing. This is a customized licensed rig, not an original bespoke model. Attribution is in `public/avatars/ATTRIBUTION.txt`. Meshopt geometry and 1024px WebP textures reduce the 35 MB source to about 4.3 MB. To rebuild: download upstream `avatars/mpfb.glb`, then run `node scripts/optimize-mira.mjs /absolute/path/source.glb`.

`MiraAvatar` renders locally using Three.js, capped at 1.5 device-pixel ratio, and uses actual HTML audio playback time. Fifteen speech shape targets anticipate the next phoneme by 30ms, use actual generated-audio energy sampled every 20ms, and blend with a bounded total mouth weight. Faster speech-shape smoothing preserves short consonants. Head/neck micro-motion, breathing and natural single/double blinks use the existing rig. Analytical two-bone inverse kinematics places wrists in front of the torso with outward elbows, preserves bone lengths and clamps reach. Gestures alternate open hands; comparison narration opens both hands. Wrist/finger articulation softens the palms. Warm/upbeat/reassuring expressions use cheeks, brows and restrained smiles, reducing smile weight during articulation. A cumulative playback clock carries gesture timing across generated audio chunks. Stop/pause closes the mouth and eases gestures back to rest. The user's reduce-motion setting disables idle and gestural movement while keeping functional lip sync. The WebGL renderer, observer, geometry, textures and materials are disposed on unmount. A labelled portrait fallback remains available if 3D cannot load.

The Kokoro voice and typed Decision Engine remain on-device and require no API key. No hosted animation service, face recording, microphone or account setup is added.

### Reference-directed presenter update
The supplied 2.4-second recording is used as motion/style reference, not embedded playback. Mira remains a customized licensed CC0 rig. The new sculpt gives a wider, softly rounded face, larger eyes and a modestly enlarged head, with consistent deformation applied to all facial targets and rebuilt normals. The ivory wardrobe and quiet studio lighting support the CARWISE interface. Open-hand reach adapts to the camera aspect ratio to keep fingers in view on narrower stages. `node scripts/stylize-mira.mjs /absolute/path/original-mpfb.glb` rebuilds the approximately 4.4 MB asset; do not feed an already quantized/stylized output back into the script.

Authored 13.6-second anticipation/hold/settle phases move between a welcome pose, open presentation, left/right explanations and a gathered rest. Later cycles alternate leading hands and omit the opening welcome. Palm orientation uses the hand's actual finger axes and an orthonormal world-space frame, rather than arbitrary wrist Euler angles. Finger curl softens for open gestures. Reduced motion keeps a static gathered pose and functional speech articulation. No frames or audio from the reference are shipped.

### Stationary presenter workspace
The Mira module has a bounded viewport-height shell. Only its labelled, keyboard-focusable right conversation panel scrolls; the character canvas remains outside that scroll container. The transcript no longer creates a second scroll surface. The panel groups topic navigation, settings, playback and the explanation, with optional voice/privacy details. Preferences and ranked results also live in this same scroll surface; sticky section buttons jump between Conversation, Preferences and Results. The Decision Engine route uses a viewport shell with no page scrollbar; its footer is omitted on this working surface. Short landscape layouts release the sticky panel heading so controls stay reachable. On mobile, the presenter occupies a fixed top row and the conversation scrolls underneath. Speech-energy accents drive bounded nods, brow lifts, eye widening, gaze shifts and slight wrist beats; reduced motion disables those accents.

Mira playback lives in the fixed presenter panel. The local voice queue prepares two segments before starting and generates ahead during playback. Follow Mira scrolls only the conversation panel to the active spoken segment; it can be disabled. Questions route to grounded decision-report explanations for comfort, efficiency, features, safety, costs, fit and comparisons. This is a local rules-based decision assistant, not a newly trained general-purpose language model.

SuggestWise expands the retained automotive workspace with /travel, /homes and /education. New-domain data is separated in lib/suggest-catalogue.ts. All initial new-domain records are fictional demo scenarios, not real listings. Scores use five domain-specific factors and adjustable normalized weights. Homes and education are scoped to Hyderabad. Saved new-domain shortlists stay on the current device. Cars keep their existing admin, pricing, comparisons and storage.

Mira supports all four decision categories through the reusable TalkingGuide scenario contract. Category-specific explanations are generated locally from the current records, normalized weights and filters. /decision-engine has a category switcher; Discuss with Mira opens each new category’s filtered context. This preserves demo and missing-evidence disclosures; it does not add live research, legal verification, admissions predictions or a hosted model.


Mira’s active presenter is the original skeletal 3D rig with reference-photo textures baked into its existing skin and outfit UVs. Run `node scripts/wrap-mira-reference.mjs` to rebuild from the preserved `mira-presenter.glb` and supplied portrait. Facial morph targets and skeletal gestures remain intact; a single photo cannot replace the existing facial geometry or hairstyle.
