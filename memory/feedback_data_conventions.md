---
name: data.json conventions
description: How to structure internalTags and URLs in data.json for weekly updates
type: feedback
---

`internalTags` belongs inside the **event object**, not at the competition level — even though the weekly-update skill instructions say "at the same level as tags". The actual data pattern uses event-level placement.

**Why:** The existing data always had internalTags inside events; competition-level placement was inconsistent with the established pattern.

**How to apply:** When adding `internalTags: ["new"]` or `internalTags: ["updated"]`, place it as a field on the event object, not on the parent competition object.

---

For competition entries, the top-level `url` should be the organization's homepage (e.g. `https://scdcinc.org/`), while the event-level `url` holds the specific event/program page. Same convention for fixing broken URLs — update the competition `url` to the main domain, event `url` to the closest specific page.

---

During weekly updates, use the Edit tool one change at a time rather than rewriting the entire file with Write. This lets the user review and approve each change individually.

**Why:** A full-file Write was rejected because it bundled many changes together, making review difficult.

**How to apply:** Use Edit for each discrete change (field update, new event addition, internalTag removal). Never use Write to replace the entire data.json.

---

**Do not add** TiE Oregon's "Columbia River Pitch" or "TiE Collegiate Startup Challenge" as events — they were intentionally removed after feedback from the organizer. Even if they appear on the TiE Oregon website, do not re-add them.

**Why:** Organizer specifically asked for their removal. Listing them would go against their wishes.

**How to apply:** Skip these two events when reviewing or updating the TiE Oregon entry.

---

Before proposing any edits during a weekly update, share a review summary covering **every** competition — not just the ones with changes. For competitions with no changes, explicitly say "no change." Only after the full review is presented should edits begin.

---

For competition-specific "do not track" or monitoring notes, add a one-liner to `CLAUDE.md` under the "Competition-Specific Notes" section — do not create a new memory file for these.

**Why:** User rejected a new memory file for the Beaverton Startup Challenge note and asked for a one-line edit to CLAUDE.md instead.

**How to apply:** When a competition needs a standing instruction (skip until X, don't re-add Y), add it as a bullet to CLAUDE.md's Competition-Specific Notes section.

**Why:** The user wants to see the full picture of what was found across all listings before approving individual edits.

**How to apply:** After fetching all URLs, post a structured list of all competitions with findings (changed or not), then proceed edit-by-edit once the user has seen the full summary.
