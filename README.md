# RouteCast — Intelligent Weather-Aware Truck Routing Platform

**RouteCast** is an enterprise-grade, weather-aware truck routing and fleet dispatch optimization platform. It safeguards long-haul trucking journeys by evaluating real-time and forecasted atmospheric conditions—including crosswinds, heavy rainfall, and blizzard snowfall—calibrated against commercial cargo weights and estimated arrival times along driving corridors.

Built with **Next.js (App Router)**, **TypeScript**, **Mapbox GL**, and the **Open-Meteo Forecast API**, RouteCast automatically analyzes multiple driving alternatives, computes risk profiles with exact non-overlapping boundary thresholds, and recommends the safest route using strict lexicographical priority criteria.

---

## 🌟 Key Features

1. **Multi-Alternative Driving Route Generation**
   - Dispatches up to 3 alternative commercial corridors via Mapbox Directions API / OSRM.
   - Evaluates route geometry, distance, and duration independently without fabricating phantom routes.

2. **Temporal Weather Sampling Engine**
   - Samples corridor coordinates at selectable intervals (**10 miles**, **25 miles**, or **50 miles**).
   - Guarantees inclusion of Route Origin (mile 0) and Destination (mile $D$).
   - Calculates **proportional estimated arrival time (ETA)** at every checkpoint based on departure time and travel progress.
   - Queries Open-Meteo hourly meteorological data for coordinates matching checkpoint arrival timestamps.
   - Flags checkpoints beyond the 14-day forecast horizon as *Forecast Unavailable* without silently substituting current weather.

3. **Exact Meteorological & Cargo Load Risk Rules**
   - **Wind Speed Risk:**
     - `< 25 mph`: Low
     - `25–34 mph`: Moderate
     - `35–44 mph`: High
     - `45–54 mph`: Severe
     - `≥ 55 mph`: No Travel
   - **Rainfall Intensity Risk:**
     - `< 0.10 in/hr`: Low
     - `0.10–0.25 in/hr`: Moderate
     - `> 0.25–0.50 in/hr`: High
     - `> 0.50–1.00 in/hr`: Severe
     - `> 1.00 in/hr`: No Travel
   - **Snowfall Intensity Risk:**
     - `< 0.5 in/hr`: Low
     - `0.5–1.0 in/hr`: Moderate
     - `> 1.0–2.0 in/hr`: High
     - `> 2.0–3.0 in/hr`: Severe
     - `> 3.0 in/hr`: No Travel
   - **Truck Cargo Load Adjustments:**
     - **Rule 1:** Wind speed $\ge 55\text{ mph}$ $\rightarrow$ **No Travel** regardless of load.
     - **Rule 2:** Wind speed $45\text{–}54\text{ mph}$ **AND** load weight $> 30,000\text{ lb}$ $\rightarrow$ **No Travel** (anti-rollover mandate).
     - **Rule 3:** Wind speed $35\text{–}44\text{ mph}$ **AND** load weight $> 40,000\text{ lb}$ $\rightarrow$ Escalated to **Severe**.
     - Highest severity always prevails across all variables.

4. **Distance-Based Route Risk Aggregation**
   - Partitions inter-checkpoint route segments at their midpoints to allocate category miles accurately.
   - Quantifies exact exposure: Low, Moderate, High, Severe, and No-Travel miles.
   - Standardized numerical scoring model for average route risk:
     $$\text{Score} = \frac{(0 \times \text{Low}) + (1 \times \text{Mod}) + (2 \times \text{High}) + (3 \times \text{Severe}) + (4 \times \text{No-Travel})}{\text{Total Evaluated Miles}}$$

5. **Lexicographical Recommendation Engine & Explainability**
   - Ranks routes using strict decision priority:
     1. Disqualify any route with **No-Travel exposure** if safe alternatives exist.
     2. **Priority 1:** Fewest Severe-risk miles.
     3. **Priority 2:** Fewest High-risk miles.
     4. **Priority 3:** Lowest average risk score.
     5. **Priority 4:** Shortest travel time.
   - Generates dynamic, data-driven natural language explanations comparing real metrics between alternatives.

6. **Interactive Mapbox Map & 48-Hour Forecast Heatmap Scrubber**
   - Displays all 3 routes simultaneously with distinct corridor colors.
   - Color-coded weather checkpoint badges (Green, Yellow, Orange, Red, Dark Red).
   - Dynamic 0–48 hour forecast time slider with Play/Pause animation loop to watch storm fronts evolve along the corridor.
   - Switchable corridor heatmap layers: **Hazard Risk**, **Wind Speed (mph)**, **Rainfall (in/hr)**, and **Snowfall (in/hr)**.
   - Interactive Checkpoint Details Drawer and searchable Milepost Log Table.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language:** TypeScript 5+ (Strict Type Checking)
- **Styling:** Tailwind CSS with custom enterprise logistics dark palette (`#080d1a`, deep navy, slate, cyan/teal accents)
- **Geospatial Processing:** Mapbox GL JS, `@turf/turf` (line geometry slicing & along interpolation)
- **Geocoding & Directions:** Mapbox Geocoding & Directions APIs (with seamless OSRM/Open-Meteo fallback)
- **Weather Provider:** [Open-Meteo Forecast API](https://open-meteo.com/) (hourly multi-location batching, zero key required)
- **Validation:** Zod v3+
- **Icons:** Lucide React
- **Testing:** Vitest v4+ (46 unit and integration test assertions)

---

## 📂 Project Architecture

```
WeatherWeb/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts      # Primary route analysis & weather pipeline
│   │   │   └── geocode/route.ts      # Autocomplete geocoding API
│   │   ├── globals.css               # Dark theme & Mapbox style overrides
│   │   ├── layout.tsx                # Root layout with JetBrains Mono & Inter fonts
│   │   └── page.tsx                  # Dashboard main view orchestrator
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Header.tsx            # Live system clock & engine status
│   │   │   ├── Sidebar.tsx           # RouteCast branding, presets & navigation
│   │   │   └── GuidelinesModal.tsx   # Fleet rules & threshold matrix modal
│   │   ├── maps/
│   │   │   ├── RouteMap.tsx          # Mapbox GL multi-route & checkpoint visualizer
│   │   │   └── ForecastTimelineSlider.tsx # 0-48h forecast scrubber & play/pause
│   │   ├── routes/
│   │   │   ├── RouteInputForm.tsx    # Origin, destination, ETA, load, interval inputs
│   │   │   ├── RouteComparisonCards.tsx # 3-alternative comparative cards
│   │   │   └── RouteExplainabilityCard.tsx # Data-driven justification breakdown
│   │   ├── settings/
│   │   │   └── TokenModal.tsx        # In-app Mapbox token configuration
│   │   ├── ui/
│   │   │   ├── Badge.tsx             # Risk severity badge component
│   │   │   ├── Button.tsx            # Enterprise button variants
│   │   │   └── Card.tsx              # Glassmorphic card containers
│   │   └── weather/
│   │       ├── CheckpointDetailsDrawer.tsx # Checkpoint meteorological drawer
│   │       └── CheckpointTable.tsx   # Filterable milepost checkpoint log
│   ├── lib/
│   │   ├── recommendation/
│   │   │   └── engine.ts             # Lexicographical route recommendation comparator
│   │   ├── risk/
│   │   │   ├── aggregator.ts         # Segment-based distance risk allocation
│   │   │   └── classifier.ts         # Numerical weather & load risk classifier
│   │   ├── routing/
│   │   │   ├── geometry.ts           # Turf checkpoint sampling & proportional ETAs
│   │   │   └── mapbox.ts             # Mapbox Directions API & OSRM fallback
│   │   ├── weather/
│   │   │   └── open-meteo.ts         # Open-Meteo multi-location batching & 48h timeline
│   │   └── utils.ts                  # Formatter helpers & Tailwind class merger
│   └── types/
│       └── routing.ts                # TypeScript domain models and interfaces
├── tests/
│   ├── api-analyze.test.ts           # End-to-end route analysis integration test
│   ├── risk-aggregator.test.ts       # Distance allocation & scoring model tests
│   ├── risk-classifier.test.ts       # Exact wind, rain, snow & load boundary tests
│   ├── route-geometry.test.ts        # Checkpoint interpolation & ETA tests
│   └── route-recommendation.test.ts  # Lexicographical priority & tie-breaking tests
├── .env.example
├── vitest.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🚀 Local Installation

### Prerequisites
- Node.js `v18.0.0` or higher (`v20+` or `v25+` recommended)
- npm, pnpm, or yarn

### Steps
1. **Clone or navigate to the repository:**
   ```bash
   cd WeatherWeb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your public Mapbox access token:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIi...
   MAPBOX_SECRET_TOKEN=
   ```
   *(Note: You can also enter your Mapbox token directly in the UI using the "Mapbox Token" button in the header).*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

RouteCast includes an extensive test suite verifying:
- Exact wind speed risk boundaries (24, 25, 34, 35, 44, 45, 54, 55 mph).
- Exact rainfall intensity boundaries (0.09, 0.10, 0.25, 0.26, 0.50, 0.51, 1.00, 1.01 in/hr).
- Exact snowfall intensity boundaries (0.49, 0.50, 1.00, 1.01, 2.00, 2.01, 3.00, 3.01 in/hr).
- Commercial load rules (45 mph + 30k lb, 45 mph + 30,001 lb, 35 mph + 40k lb, 35 mph + 40,001 lb, 55 mph + any load).
- Geometry sampling at 10, 25, and 50 miles, ensuring origin & destination are always preserved.
- Monotonically increasing proportional arrival time calculations.
- Midpoint segment distance allocation and average risk score formulas.
- Lexicographical priority ordering, tie-breaking, and No-Travel hazard disqualification.

Run the test suite:
```bash
npm test
```

---

## 🌐 API Documentation

### 1. `POST /api/analyze`
Executes multi-route generation, spatial checkpoint sampling, weather fetching, risk evaluation, and route recommendation.

**Request Body (JSON):**
```json
{
  "origin": {
    "name": "Chicago, Illinois, United States",
    "coordinates": [-87.6298, 41.8781]
  },
  "destination": {
    "name": "Denver, Colorado, United States",
    "coordinates": [-104.9903, 39.7392]
  },
  "departureTime": "2026-11-06T08:00:00Z",
  "loadWeightLb": 35000,
  "samplingIntervalMiles": 25,
  "clientMapboxToken": "pk.eyJ..."
}
```

**Response (JSON):**
Returns a structured `RouteAnalysisResult` containing:
- `routes`: Array of `EvaluatedRoute` objects with checkpoints, segments, and risk profiles.
- `recommendedRouteId`: Identifier of the optimal route (`"route-1"`, `"route-2"`, etc.) or `null` if all routes have No-Travel exposure.
- `recommendationExplanation`: Data-driven natural language justification.
- `hasSafeRoute`: Boolean flag.
- `routingEngine`: `"mapbox"` or `"osrm"`.

---

### 2. `GET /api/geocode?q={query}`
Provides debounced location autocomplete suggestions with geographic coordinates.

**Query Parameters:**
- `q`: Search query string (minimum 2 characters).

**Response (JSON):**
```json
{
  "results": [
    {
      "id": "om-4887398",
      "name": "Chicago, Illinois, United States",
      "coordinates": [-87.65005, 41.85003]
    }
  ],
  "provider": "mapbox"
}
```

---

## 🚢 Vercel Deployment Instructions

RouteCast is fully architected for serverless deployment on Vercel:

1. **Push to GitHub / GitLab / Bitbucket:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete production implementation of RouteCast"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
   - Import your repository.
   - In **Environment Variables**, add:
     - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Your Mapbox public access token.
     - `MAPBOX_SECRET_TOKEN` (Optional): Server token if routing restrictions apply.
   - Click **Deploy**.

3. **Verify Build:**
   Next.js App Router will compile all static pages and API routes with full serverless execution compatibility.

---

## 🔒 Security & Performance Best Practices

- **Zero API Key Leakage:** Open-Meteo requires no secret keys. Mapbox tokens are kept either strictly server-side or scoped via `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for client vector rendering.
- **Batched Network Calls:** Multi-location querying aggregates all route checkpoint coordinates into single requests, reducing network calls by over 90%.
- **Zero Mock Fallback:** When live external APIs encounter limits or when time falls outside the 14-day forecast horizon, RouteCast explicitly informs the user with transparent status indicators rather than faking data.

