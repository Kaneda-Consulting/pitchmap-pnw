# PitchMap PNW 

**A community-maintained directory of startup pitch competitions across Oregon and Washington.**

🌐 **[pitchmappnw.com](https://pitchmappnw.com)**

✏️ Updated on Wednesdays.

---

PitchMap PNW helps entrepreneurs in the Pacific Northwest find pitch competitions, track which ones are actively accepting applications, and discover the organizations that host them. It's searchable by location, filterable by status, and includes a map so you can find opportunities near you.

The directory is updated weekly and covers the Portland metro area, the Columbia River Gorge, and the broader Oregon and Washington startup ecosystem.

---

## What's in the directory

Each listing includes:

- **Host organization** and the events they run
- **Status** — whether applications are open, an event is scheduled, or it's worth monitoring
- **Service area** — Portland Metro, Oregon statewide, Seattle Metro, Washington, PNW-wide, or the Columbia River Gorge
- **Award type** — Cash/Grant, Investment, Loan, In Kind, or None
- **Notes** — deadlines, event dates, and other timely details
- **Links** — to the organization's website and event/application page when available

---

## How to suggest a listing

Know of a pitch competition, host organization, or community group that should be on this list? There are two ways to suggest it:

### Option 1 — Google Form (easiest)
Fill out the [Suggest a Listing form](https://forms.gle/DGBsjABtrnDjWZv97). No GitHub account needed.

### Option 2 — GitHub Issue (preferred)
[Open an issue](https://github.com/lkaneda/pitchmap-pnw/issues/new?template=suggest-a-listing.md) using the **Suggest a Listing** template. This keeps everything in one place and lets the community see what's been requested.

All submissions are reviewed before being added. The maintainer typically processes new suggestions within a week.

---

## How to request a feature, report a bug, or update a listing

All requests are tracked as GitHub issues. Use the links below to open the right template:

- **Update a listing** — something has changed with an existing org or event (new status, wrong link, outdated info): [Open an update request](https://github.com/lkaneda/pitchmap-pnw/issues/new?template=update-a-listing.md)
- **Request a feature** — an idea for something new the site should do: [Open a feature request](https://github.com/lkaneda/pitchmap-pnw/issues/new?template=feature_request.md)
- **Report a bug** — something on the site is broken or behaving unexpectedly: [Open a bug report](https://github.com/lkaneda/pitchmap-pnw/issues/new?template=bug_report.md)

You can also browse [all open issues](https://github.com/lkaneda/pitchmap-pnw/issues) to see what's already been reported or requested before filing a new one.

---

## How the data works

Everything in the directory lives in a single file: [`data.json`](data.json). Each host organization has an entry that looks like this:

```json
{
  "id": "example-org",
  "org": "Example Organization",
  "url": "https://example.org",
  "serviceArea": "portland-metro",
  "location": { "lat": 45.5231, "lng": -122.6765, "city": "Portland, OR" },
  "tags": ["general", "early-stage"],
  "events": [
    {
      "name": "Example Pitch Night",
      "status": "accepting",
      "description": "A brief description of the event.",
      "url": "https://example.org/pitch",
      "eventUrl": "https://example.org/apply",
      "notes": "Applications open through May 1. Event on May 20.",
      "prizeType": "cash",
      "accelerator": true,
      "serves": "Greater Portland Metro Area",
      "counties": ["Multnomah County", "Washington County"]
    }
  ]
}
```

### Status values

| Status | Meaning |
|---|---|
| `"accepting"` | 🟢 Actively accepting applications right now |
| `"scheduled"` | 🟡 Event announced, applications closed or opening soon |
| `"monitor"` | 🔵 No active event — worth checking back periodically |
| `"inactive"` | ⚫ Has hosted before but currently appears inactive |

### Service area values

| Value | Meaning |
|---|---|
| `"portland-metro"` | Greater Portland area (~50 mile radius) |
| `"seattle-metro"` | Greater Seattle area (~50 mile radius) |
| `"gorge"` | Columbia River Gorge region (~60 mile radius from The Dalles) |
| `"oregon"` | Oregon state |
| `"oregon-sw-washington"` | Oregon and SW Washington (e.g. Vancouver, WA area) |
| `"oregon-south-coast"` | Oregon Southern Coastal Cities - Florence, Reedsport, North Bend, Coos Bay, Bandon, Coquille, Lakeside, Myrtle Point, Powers, Port Orford, Gold Beach, and Brookings |
| `"washington"` | Washington state |
| `"pnw"` | Oregon + Washington |

### Optional event fields

| Field | Type | Meaning |
|---|---|---|
| `"accelerator"` | boolean | Whether the pitch is part of an accelerator program and not open to all applicants. Defaults to `false`; only set when `true`. |
| `"serves"` | string | Override the service area label displayed in the modal (e.g. `"Oregon & SW Washington"`) |
| `"counties"` | array | Restrict the event to specific counties (e.g. `["Multnomah County"]`) |

### Prize type values

| Value | Meaning |
|---|---|
| `"cash"` | Cash prize or grant |
| `"investment"` | Equity or SAFE investment |
| `"loan"` | Loan financing opportunity |
| `"in-kind"` | Non-monetary prizes that hold value |
| `"none"` | No prize |

`prizeType` accepts either a single value or an array when an event offers more than one kind of prize, e.g. `"prizeType": ["cash", "investment"]`. Each value is shown as its own tag and matched by the corresponding filter.


---

## Project structure

```
pitchmappnw/
├── index.html    ← The website (HTML, CSS, and JS in one file)
├── data.json     ← All directory data — the only file updated regularly
└── README.md     ← This file
```

The site is a single static HTML file with no build step, no framework, and no backend. It loads `data.json` at runtime. Hosting is free via [GitHub Pages](https://pages.github.com/).

---

## Maintained by

[Leila Kaneda](https://github.com/lkaneda), with seed data contributed by **Matthew Spellman**.

Community partner: [RAIN Catalysts](https://raincatalysts.org)

Licensed under [CC0 1.0 Universal](LICENSE) — public domain, no restrictions.
