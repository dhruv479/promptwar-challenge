# TripPulse — Technical Implementation Plan (V1 / MVP)

> Sibling document to [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md). Where the product plan describes *what* TripPulse does, this plan describes *how* we build it — architecture, data model, AI pipeline, security, accessibility, testing, and milestones.
>
> **Status:** Updated to reflect the architecture pivot (Local-First, No Backend Persistence).

---

## 0. Architecture Pivot & Locked Decisions

| # | Decision | Rationale | Implementation impact |
|---|---|---|---|
| 1 | **No Backend Persistence** | Eliminate database hosting costs, simplify operational burden, and focus entirely on the core AI/UX loop for MVP. | No Postgres, no Redis. User data is ephemeral to their device unless explicitly exported. |
| 2 | **`localStorage` Data Layer** | The app is effectively local-first. Trips, itineraries, and preferences live in the browser's `localStorage`. | State management via Zustand, synchronized to `localStorage`. Zod schemas validate data on read/write to prevent corruption. |
| 3 | **Firebase Auth** | Simple, drop-in authentication for protecting backend API routes (preventing abuse of our API keys) and providing a consistent user identity, even if data is local. | Client-side SDK for login; backend API routes verify Firebase ID tokens before making expensive LLM/Places calls. |
| 4 | **Single Next.js application** | We need a backend *only* as a proxy to hide API keys (Vertex AI, Google Places, OpenWeatherMap) and enforce rate limits. Next.js App Router handles both the React frontend and the necessary API Route Handlers. | Deployed to Vercel (or Cloud Run). No background workers, no message queues. |
| 5 | **Static / In-Memory POI Catalogue** | Without a vector DB (pgvector), we cannot do dynamic RAG from a database. Instead, the top-20 destinations and curated places are bundled as static JSON assets. | Client or edge-function filters this static catalogue based on preferences before sending to the LLM. |
| 6 | **Component library: shadcn/ui** | Strongest accessibility baseline (keyboard nav, focus, ARIA correctness). | Full WCAG 2.2 AA compliance capability. |

---

## 1. Goals & non-goals

### Goals
- Ship the V1 scope at production quality: secure, accessible, beautiful, and highly responsive.
- Prove the core value proposition: AI-generated, dynamic travel itineraries.
- Operate at near-zero fixed infrastructure cost (serverless + local storage).

### Non-goals (V1)
- Cross-device syncing (data lives in local storage on the device it was created on).
- Collaborative planning (requires a centralized backend).
- Real flight/hotel booking integration.
- Native mobile apps.

---

## 2. Architecture overview

```mermaid
flowchart TB
    User([User browser])
    LocalStorage[("Browser localStorage<br/>(Trips, Preferences)")]
    NextWeb["Next.js App<br/>(React Server Components & Client Components)"]
    NextAPI["Next.js Route Handlers<br/>(API Proxy)"]
    Firebase["Firebase Auth"]
    Vertex["Vertex AI / Gemini"]
    Maps["Google Maps & Places API"]
    Weather["OpenWeatherMap API"]

    User <--> NextWeb
    User <--> LocalStorage
    User <--> Firebase
    NextWeb --> NextAPI
    NextAPI --> Firebase : Verify ID Token
    NextAPI --> Vertex
    NextAPI --> Maps
    NextAPI --> Weather
```

**Workflow:**
1. User logs in via Firebase Auth (Google/Email).
2. User uses the UI to plan a trip; all state (form inputs, preferences) is held in React state.
3. To generate an itinerary, the frontend calls the Next.js API route `/api/generate`, passing the Firebase ID token and the trip parameters.
4. The API route verifies the token, selects candidate POIs from the static JSON catalogue, calls Vertex AI (Gemini), and returns the generated itinerary.
5. The frontend saves the generated itinerary directly to `localStorage`.

---

## 3. Tech stack

| Layer | Choice | Why this, not the alternative |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | API routes acting as secure proxies for external APIs; simple deployment. |
| State & Storage | **Zustand + `localStorage`** | Zustand's `persist` middleware automatically syncs the store to `localStorage`. |
| Auth | **Firebase Auth** | Industry standard, quick setup, provides identity to rate-limit API calls. |
| UI primitives | **shadcn/ui (Radix)** | Best a11y baseline; copy-owned components. |
| Styling | **Tailwind CSS** | Standard, rapid iteration. |
| Forms / validation | **React Hook Form + Zod** | Same Zod schemas drive Gemini `responseSchema` and localStorage validation. |
| AI | **Vertex AI Node SDK (`@google-cloud/vertexai`)** | Gemini Pro/Flash for structured output generation. |
| Maps | **Google Maps Platform** | Industry-standard for places and maps. |

---

## 4. Service Map (Simplified)

| Layer | Service | Role |
|---|---|---|
| Hosting | **Vercel** (or Cloud Run) | Hosts the Next.js frontend and serverless API route handlers. |
| Identity | **Firebase Auth** | Manages user sign-in and mints JWTs. |
| AI | **Vertex AI (Gemini)** | LLM for generating and refining itineraries. |
| Weather | **OpenWeatherMap** | Forecasts for the trip window. |
| Maps | **Google Maps / Places** | Renders maps and fetches live POI details (photos, hours). |

*No database, cache, or message brokers required.*

---

## 5. Repository structure

```text
tripulse/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing, browse pages
│   ├── (app)/              # Authenticated app: itinerary builder
│   └── api/                # Route handlers (auth verification, AI proxy, Places proxy)
├── components/             # shadcn/ui + custom components
├── lib/
│   ├── store/              # Zustand stores (persisted to localStorage)
│   ├── planner/            # Itinerary engine logic (client & server shared)
│   ├── db/                 # Static JSON catalogues (destinations, curated places)
│   ├── ai/                 # Gemini prompts, Zod response schemas
│   └── firebase/           # Firebase client & admin SDK setup
├── types/                  # Shared TypeScript interfaces
└── mockups/                # Design references
```

---

## 6. Data model (Local Storage Layer)

Since we use `localStorage`, we define strict TypeScript interfaces validated by Zod when reading from/writing to the browser.

```ts
// Local Storage Key: `tripulse_user_profile`
interface PreferenceProfile {
  sliders: { budget: number; pace: number; indoor: number };
  interest_tags: string[];
  dietary: string[];
  accessibility: string[];
}

// Local Storage Key: `tripulse_trips`
// An array of Trip objects
interface Trip {
  id: string; // uuid
  destinationId: string;
  startDate: string;
  endDate: string;
  partyShape: 'solo' | 'couple' | 'family' | 'group';
  status: 'draft' | 'finalised' | 'archived';
  createdAt: number;
  updatedAt: number;
}

// Local Storage Key: `tripulse_itineraries`
// A dictionary mapping tripId to their specific itineraries
interface ItineraryStore {
  [tripId: string]: Itinerary;
}

interface Itinerary {
  id: string;
  version: number;
  payload: {
    days: Array<{
      date: string;
      activities: Array<{
        id: string;
        startTime: string;
        endTime: string;
        type: string;
        title: string;
        googlePlaceId: string | null;
        intensity: 'low' | 'med' | 'high';
      }>;
    }>;
  };
}
```

**Data Access Pattern:**
The Zustand store wraps `localStorage`, providing hooks like `useTrip(id)` and `useItinerary(tripId)`. When the app loads, Zustand reads and parses the JSON. If parsing fails (data corruption), the store resets to default or attempts a safe migration.

---

## 7. AI/ML pipeline

### 7.1 Generation flow (Local-First)

1. **User triggers generation**: Frontend collects preferences from Zustand and trip details.
2. **API Request**: Frontend POSTs to `/api/generate` with Firebase ID Token in the Authorization header.
3. **Auth & Rate Limiting**: The Next.js route verifies the token using `firebase-admin`. Applies an in-memory or Vercel KV rate limit per user ID.
4. **Context Assembly**: Instead of pgvector, the server loads a static, bundled `catalogues/places.json`. It filters the places based on the requested destination and basic interest tags to get a candidate list of ~50 places.
5. **LLM Call**: Server calls Gemini 2.0 Flash/Pro with the candidate list and the strict Zod `responseSchema`.
6. **Response**: The server applies deterministic post-processing (checking overlap, pacing) and returns the JSON payload.
7. **Client Storage**: The frontend saves the returned itinerary into `tripulse_itineraries` in `localStorage`.
8. **Enrichment**: The frontend subsequently calls `/api/places/details` (a proxy to Google Places) to fetch live photos and opening hours for the returned place IDs.

### 7.2 Refinement
Manual user edits (drag-and-drop on the timeline) are executed purely client-side, instantly mutating the Zustand store and `localStorage`. AI refinement ("make day 2 less intense") triggers a similar API flow, passing the *existing* itinerary as context.

---

## 8. External integrations & feature handling

- **Google Places**: Proxied through `/api/places` to hide the API key. Used primarily for Place Details (photos, ratings) *after* the LLM has generated the structure based on our static catalogue.
- **Weather**: Proxied through `/api/weather`. Fetches 10-day forecasts from OpenWeatherMap.
- **Simulated Features**:
  - Live crowds: Simulated client-side using a seed based on the place ID and time of day.
  - Price tracking: Simulated random-walk client-side.
- **Authentication**: Firebase Auth (Google + Email/Password). Used strictly as a gateway to prevent unauthenticated abuse of our API routes.

---

## 9. Security

- **No User Data on Server**: The backend is stateless. It does not store user emails, preferences, or itineraries. It only proxies requests.
- **API Protection**: All Next.js API routes require a valid Firebase ID token.
- **Secrets Management**: Vercel Environment Variables hold the Firebase Admin JSON, Vertex AI credentials, Google Maps key, and OpenWeatherMap key.
- **CORS & Headers**: Strict CORS applied to Next.js routes; standard security headers defined in `next.config.js`.

---

## 10. Accessibility (WCAG 2.2 AA)

Remains a top priority.
- Relies on Radix primitives via `shadcn/ui`.
- `dnd-kit` for keyboard-accessible drag-and-drop on the itinerary timeline.
- High contrast tokens, visible focus rings, and proper ARIA labels.

---

## 11. Testing strategy

- **Unit/Logic (Vitest)**: Heavy focus on the client-side deterministic post-processor, Zustand store reducers, and Zod parsers to ensure local data integrity.
- **Components (Vitest + RTL)**: Standard testing for UI elements.
- **E2E (Playwright)**: Testing the full flow from landing page -> mock generation API -> localStorage save -> timeline render.

---

## 12. Deployment

- **Hosting**: Vercel (or GCP Cloud Run). Given the stateless Next.js app, Vercel is the fastest path.
- **CI/CD**: GitHub integration with Vercel for automatic branch previews and main-branch production deployments.

---

## 13. Product-spec items adapted for Local-First

| Feature | Adaptation |
|---|---|
| "Save itinerary" | Saved instantly to device `localStorage`. Cannot be viewed on a different device unless an "Export/Import" feature is built later. |
| "Share itinerary" | Since there is no DB to host a shared link, sharing MVP means generating a static encoded URL (if small enough), a PDF download, or copying text to clipboard. |
| "Collaborative planning" | Removed from scope entirely. Cannot be done without a centralized database. |

---

## 14. Milestone plan (Accelerated due to pivot)

By removing the database, migrations, backend state, and complex infrastructure, the timeline compresses significantly.

| Week | Focus |
|---|---|
| 1 | Next.js setup, Tailwind, shadcn/ui, Firebase Auth integration. Setup Zustand + localStorage persistence. |
| 2 | Static POI catalogue generation. Landing page and destination browsing UI. |
| 3 | AI Prompt Engineering. Next.js API route for Gemini generation using the static catalogue. |
| 4 | Interactive Timeline UI (dnd-kit) and Activity Cards. Connect client to generation API. |
| 5 | Map integration, Weather proxy, and mock flight/hotel listings UI. |
| 6 | Polish, accessibility audit, error handling for corrupted localStorage state. Launch. |
