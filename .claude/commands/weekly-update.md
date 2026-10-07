# Weekly Update

Perform a weekly maintenance update on `data.json` for the PitchMap PNW directory.

**Arguments (optional):**
- `--update-only` — only check existing listings for updates, skip adding new entries
- `--add-only` — only add new entries provided below, skip checking existing listings
- `#<number>` — one or more GitHub issue numbers (e.g. `#42 #55`) referencing `listing-request` or `listing-update` issues to process
- `<url>` — one or more URLs (e.g. `https://example.com/pitch`) to WebFetch and build a new entry from
- Default (no args): do both — check existing listings AND add new entries

**Arguments received:** $ARGUMENTS

---

## Instructions

Parse the arguments from `$ARGUMENTS`:
- If `--update-only` is present, set mode to update-only.
- If `--add-only` is present, set mode to add-only.
- Otherwise set mode to both.
- Extract any GitHub issue numbers (patterns like `#42`, `42`, `issue/42`).
- Extract any URLs (strings starting with `http://` or `https://`).

Any content in `$ARGUMENTS` that is not a flag, issue number, or URL is treated as raw new listing data (JSON or descriptive text) to add directly — it may describe a competition, aggregator, or community entry; see Step 3 for how to tell which.

Read `data.json` in full before making any changes.

---

### Schema reminder — read this before writing `status`, `serviceArea`, `prizeType`, or `internalTags`

Each competition object has its OWN `tags` array (category tags like `"general"`, `"early-stage"` — never touch these for update tracking). `internalTags` is a completely different field that lives **only inside an event object**, as a sibling of `prizeType`:

```json
{
  "id": "example-org",
  "serviceArea": "portland-metro",
  "tags": ["general", "early-stage"],
  "events": [
    {
      "name": "Example Pitch Event",
      "status": "accepting",
      "prizeType": "cash",
      "accelerator": false,
      "internalTags": ["new"]
    }
  ]
}
```

Never add `internalTags` as a property of the competition object itself, and never confuse it with the competition's `tags` array. Before writing `internalTags` anywhere, check that the object you're adding it to is inside `events[]`.

**`status`, `serviceArea`, and `prizeType` are closed enums — use one of these exact strings, never a paraphrase or invented value.** The site's filtering does exact string matching, so a near-miss value (e.g. `"washington-state"` instead of `"washington"`) silently breaks filtering with no error.

- `status`: `accepting`, `scheduled`, `monitor`, `inactive`
- `serviceArea`: `portland-metro`, `seattle-metro`, `gorge`, `oregon`, `oregon-sw-washington`, `oregon-south-coast`, `washington`, `pnw`
- `prizeType`: `cash`, `investment`, `both`, `loan`, `in-kind`, `none`

These are the full lists — don't assume a value is valid just because it sounds plausible or isn't yet used anywhere in `data.json` (e.g. `"washington"` has no current example but is valid). Full definitions for each value are in `README.md`'s "How the data works" section.

**Optional event fields** — set only when they apply (full definitions in `README.md`):
- `accelerator` (boolean): true if the pitch is only open to an accelerator cohort, not all applicants. Defaults to `false`; omit or set `false` otherwise.
- `serves` (string): overrides the service-area label shown in the modal, e.g. `"Oregon & SW Washington"`.
- `counties` (array): restricts the event to specific counties, e.g. `["Multnomah County"]`.

---

### Step 1 — Clear all internal tags (always run this first)

In `data.json`, find every **event** object (inside a competition's `events[]` array) that has an `"internalTags"` field. Remove the entire `"internalTags"` field from each event. This clears the "new" and "updated" badges set during previous weeks. (`internalTags` belongs on event objects, not on the competition object — the site's badge/sort logic in `index.html` only reads `event.internalTags`, so a tag placed on the competition object is silently ignored.)

---

### Step 2 — Check existing listings for updates (skip if `--add-only`)

**Special cases — check these before applying any update:**
- **Beaverton Startup Challenge (Oregon Startup Center):** Keep its status at `monitor` regardless of what their website says. Their site (oregonstartupcenter.org) is known to be stale and has previously shown "applications open" messaging that wasn't real. Only change this status based on external confirmation (e.g., a press release or a partner org's announcement) — never from their own site alone.
- **Columbia River Pitch / TiE Collegiate Startup Challenge (TiE Oregon):** These are not tracked in this directory — removed at organizer request. If TiE Oregon's site mentions either, skip it; do not add or update an entry for it.

For each competition in `data.json`:

1. Fetch the competition's `url` using WebFetch.
2. Compare what you find on the page against the current entry's `events`, `notes`, `status`, `description`, and `eventUrl` fields. Regardless of whether anything changed, note what you found (confirmed via site, got an error, nothing new, etc.) — this feeds the full status summary in Step 5. If the fetch fails, errors, or is blocked (403, timeout, CAPTCHA, etc.), do not infer or change any field based on memory or assumption — treat it the same as "nothing new found" and just record the failure for the summary.
3. If anything has **materially** changed (new application window opened, status changed, date announced, new event added, event cancelled, etc.):
   - Update the relevant fields in `data.json`.
   - If an event's `status` is being set to `monitor` or `inactive`, also set that event's `eventUrl` to `null`.
   - Add `"internalTags": ["updated"]` **inside the specific event object that changed**, as a sibling of `"prizeType"` — see the schema reminder above. Never add it to the competition object, and never add it to the competition's `tags` array.
   - Record what changed for the summary.
4. If nothing material has changed, leave the entry as-is. Do not add internalTags. Minor clarifications do **not** count as material — e.g., adding a venue name, noting that finalists were announced, or adding a secondary/supplementary event detail. Only tag "updated" for things like: status changes, new application windows, deadline changes, events added/cancelled, new event URLs, or newly announced dates.

Work through all competitions. Fetch their URLs in parallel where possible to save time.

---

### Step 3 — Add new entries (skip if `--update-only`)

**First, determine what kind of listing this is and check for duplicates.** The directory has three separate schemas — don't force everything into the competition one:

- **Competition** (an org that hosts a pitch event with applications/deadlines) → `competitions[]`: `id`, `org`, `url`, `serviceArea`, `location`, `tags`, `events[]` (event-level fields per the schema reminder above).
- **Event aggregator / calendar** (a calendar or news source listing many orgs' events, not a single host) → `aggregators[]`: `{ "id", "name", "url", "description", "icon" }`, where `icon` is a single emoji (see existing `data.json` entries for examples).
- **Community group** (a founder community, meetup, or accelerator that isn't itself a pitch competition host) → `community[]`: `{ "id", "name", "url", "focus" }`, where `focus` is a short descriptive string, e.g. `"Founder community"`.

For GitHub issues, use the issue body's "Type" checkbox (Pitch Competition Host / Event Aggregator-Calendar / Community Group / Other) to decide which schema applies. For URLs or raw data with no explicit type, infer it from the content: a single org running pitch events with application windows is a competition; a calendar/listing site aggregating many orgs' events is an aggregator; a founder/community group that doesn't itself host a pitch competition is a community entry. If the type is "Other" or genuinely ambiguous, don't force it into any schema — note it in the summary for manual review instead.

Before adding anything, search `data.json`'s `competitions`, `aggregators`, and `community` arrays for a matching `org`/`name` or `url`. If a close match already exists, update that existing entry's fields directly instead of creating a duplicate — for a competition match, follow Step 2's comparison approach and tag the changed event `"updated"`; for an aggregator or community match (which have no `events[]`), just update the changed fields directly — there's no `internalTags` to set.

**If GitHub issue numbers were provided in `$ARGUMENTS`:**

For each issue number, fetch it via the GitHub API using WebFetch:
```
https://api.github.com/repos/lkaneda/pitchmap-pnw/issues/<number>
```
Read the issue body to extract the organization name, website URL, type, prize type, and any notes. Check the `labels` array to determine how to handle it:

- Label `listing-request` → add as a new entry (competition, aggregator, or community — per the Type checkbox above).
- Label `listing-update` → apply the described update to the matching existing entry instead. If the match is a competition, tag the changed event `"updated"`; aggregator and community entries have no `events[]`, so there's nothing to tag there — just update the fields.

WebFetch the URL from the issue body to fill in full details before writing the entry.

After all changes are written, note in the summary which issues were processed and remind the user to close them manually on GitHub, since issue management requires browser access.

**If URLs were provided in `$ARGUMENTS`:**

For each URL, WebFetch the page and extract everything available: organization name, event name, description, dates, application status, prize type, geography served, and any event-specific URL. Use that to construct a full entry of the appropriate type. If the page doesn't have enough information to fill a field confidently, use a reasonable default or leave it as `null`.

**If raw competition data was provided (not an issue number or URL):**

Parse the text/JSON directly and construct the entry from it.

**For new competition entries:**

1. Must follow the existing schema: `id`, `org`, `url`, `serviceArea`, `location`, `tags`, `events[]`.
2. Derive `id` from the org name (lowercase, hyphenated, no special characters).
3. Use WebFetch on the competition URL to fill in description, status, and event details accurately.
4. For `location.lat`/`lng`, use the org's city-center coordinates. An approximate city-center value is fine — precision to the building level isn't required — but if you're not confident of the coordinates for a smaller or less-familiar city, look them up rather than guessing.
5. Add `"internalTags": ["new"]` inside each event object within the new competition's `events[]` array, as a sibling of `"prizeType"` — see the schema reminder above. Never add it to the competition object itself or to its `tags` array.
6. Place new competitions at a sensible position in the `competitions[]` array (generally at the end, or grouped with similar orgs).
7. Record the org name of each addition for the summary.

**For new aggregator entries:**

1. Must follow the schema: `id`, `name`, `url`, `description`, `icon` (a single emoji).
2. Derive `id` from the name (lowercase, hyphenated, no special characters), same convention as competitions.
3. Add to the top-level `aggregators[]` array.
4. Record the name of each addition for the summary.

**For new community entries:**

1. Must follow the schema: `id`, `name`, `url`, `focus`.
2. Derive `id` from the name (lowercase, hyphenated, no special characters), same convention as competitions.
3. Add to the top-level `community[]` array.
4. Record the name of each addition for the summary.

`internalTags` only ever applies to competition events — aggregator and community entries have no `events[]` and never get `internalTags`.

If no new entry data was provided at all, note "No new entries provided" in the summary.

---

### Step 4 — Update meta.lastUpdated

Set `meta.lastUpdated` in `data.json` to today's date in `YYYY-MM-DD` format.

---

### Step 5 — Print a summary

After all changes are written, print a summary to the console in this format:

```
=== Weekly Update Summary (YYYY-MM-DD) ===

CLEARED INTERNAL TAGS: <count> competitions had tags removed

UPDATED LISTINGS (<count>):
  - <org name>: <brief description of what changed>
  - <org name>: <brief description of what changed>
  (or "None" if no updates were found)

NEW ENTRIES ADDED (<count>):
  - <org/name> (competition | aggregator | community)
  (or "None" if no new entries were added / skipped due to --update-only)

NO CHANGES DETECTED:
  <count> listings checked, no material changes found.

ALL EVENT STATUSES:
  - <org name> — <event name>: <status> — <finding note, e.g. "checked website, no material changes" / "got 403, could not read" / "confirmed Sept 17 event still listed">
  (list every event checked, not just the ones that changed)

Mode: <both | update-only | add-only>
```

If there were zero total changes (no updates found and no new entries), make that explicit:
"No changes were made to data.json this week."
