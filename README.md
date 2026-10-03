# CARWISE
Responsive car buying decision intelligence frontend for India.

## Run
npm install
npm run dev
npm run build

## Product
Homepage, searchable catalogue and price filters, Top 20 category views, car scorecards, a 60-attribute feature matrix, four-car comparison, recommendation wizard, local shortlist, ownership calculator, guides and local admin draft workspace.

Built with React, TypeScript, Next-compatible Vinext routing, Tailwind, shadcn dialog/tabs, Recharts and Lucide. Data lives in lib/cars.ts, separate from the interface. Evidence<T> supports source type, timestamp and confidence; evidenceFor maps prototype records to explicitly low-confidence demo evidence.

## Data trust
All 22 vehicle records use SAMPLE/DEMO values. The first developed record is Honda Elevate ZX CVT. Prices, illustrative category assessments, feature availability and efficiency estimates require verification. No owner reviews or Indian NCAP scores are fabricated. Manufacturer photography is remotely hosted and attributed; most catalogue photography remains unavailable.

## Persistence and production boundaries
Shortlists, comparisons, calculator assumptions and admin price drafts use device-local browser storage. Admin is a prototype workspace, not authenticated or connected to a production database. No PostgreSQL/Prisma, authentication, live pricing, review ingestion, or generative assistant backend is connected. The assistant uses bounded structured sample answers. Broader advanced filters require populated evidence fields. The wizard uses budget, fuel, transmission and leading priority; other answers are recorded preferences.

Costs: purchase + five-year fuel + maintenance + insurance + total loan interest. Principal is not double-counted. Insurance is a flat annual scenario; no depreciation, resale credit, inflation or time value is modeled. City pricing uses clearly labeled demo multipliers.
