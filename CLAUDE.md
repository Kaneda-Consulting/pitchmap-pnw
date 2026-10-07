# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PitchMap PNW is a community-maintained directory of startup pitch competitions in Oregon and Washington. It is a **single-file static web app** — no build step, no framework, no backend. The entire application is `index.html` (HTML + CSS + JS inline) and `data.json` (all directory content). It is hosted on GitHub Pages at pitchmap-pnw.com.

## Running Locally

Open `index.html` directly in a browser. No server required — but note that `fetch('data.json')` will fail on `file://` URLs in some browsers. The app includes a `FALLBACK_DATA` object embedded in `index.html` as a failsafe for this case.

To serve properly:
```
python3 -m http.server 8080
# then open http://localhost:8080
```

There are no build, lint, or test commands — the project has no `package.json` or dependencies.

## Architecture

**`index.html`** — the entire application, organized into clearly commented sections:
- CSS custom properties define the design system (dark theme, color variables, fonts)
- JavaScript loads `data.json` via `fetch()` at boot, then calls `init()` to render everything
- State is minimal: `DATA` (loaded JSON), `searchQuery`, `activeFilters` (Set), `currentPage`
- Render functions: `renderCards()`, `renderPagination()`, `renderAggregators()`, `renderCommunity()`, `renderMeta()`
- Interactive map uses [Leaflet 1.9.4](https://leafletjs.com/) (loaded via CDN) with OpenStreetMap tiles and Nominatim for geocoding
- Nearby filtering uses the Haversine formula in `servesLocation()` which checks a competition's `serviceArea` against the user's coordinates
- Modal system: clicking a card opens an overlay with full event details; closes on background click or Escape

**`data.json`** — all directory content structured as:
```json
{
  "meta": { "siteName", "tagline", "lastUpdated", "maintainer", "githubHandle" },
  "competitions": [ { "id", "org", "url", "serviceArea", "location", "tags", "events": [...] } ],
  "aggregators": [ { "id", "name", "url", "description", "icon" } ],
  "community": [ { "id", "name", "url", "focus" } ]
}
```

Each competition has one or more `events`, each with a `status` field: `accepting`, `scheduled`, `monitor`, or `inactive`. Cards are sorted by `STATUS_PRIORITY` order.

## Contributing Data

Data changes go in `data.json` only. The README describes the full data schema including valid values for `serviceArea`, `prizeType`, and `status` (`tags` is free-text, not a closed list). The `.github/ISSUE_TEMPLATE/` directory has issue templates for different request types (new competitions, updates, bugs, suggestions).

## Competition-Specific Notes

- **Beaverton Startup Challenge**: Keep at `monitor` until there is external word of a new cycle — their website is not kept current and should not be used to infer status.
- **TiE Oregon**: Do not add "Columbia River Pitch" or "TiE Collegiate Startup Challenge" — removed at organizer request.

## Key Design Constraints

- No npm, no build pipeline, no transpilation — keep it that way
- External resources load from CDN only (Leaflet, Google Fonts, OpenStreetMap)
- License is CC0 1.0 (public domain)
