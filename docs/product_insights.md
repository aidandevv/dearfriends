# Product Insight Journal
> Chronological log of user pain points, UX friction, product hypotheses,
> positioning insights, roadmap trade-offs, experiments, and product decisions.

---

### [PI-UX-FRICTION] | 2026-06-20: Zoomed globe dragging felt overpowered

**Observation:**
- A user reported that the dashboard globe still dragged with the same rotation speed after zooming in, making close-up navigation feel too aggressive.

**Why It Matters:**
- Map-like interactions need local control to feel trustworthy; zooming in should make exploration more precise, not more slippery.

**Evidence:**
- **Source:** Direct user feedback during globe interaction polish.
- **Strength:** Medium

**Hypothesis / Next Step:**
- Scaling drag and coast sensitivity down above 1x zoom should make close inspection feel calmer while preserving the familiar default globe movement.

> **[CROSS-LOG]** Engineering root cause logged in `./docs/dev_journal.md` - see [CP-DEBUG] | 2026-06-20: Zoom-aware globe drag sensitivity.

---

### [PI-TRUST] | 2026-06-22: Branded lifecycle emails reinforce recipient trust

**Observation:**
- The app sends several different Resend emails across recipient verification, address refresh, admin note notifications, reminders, birthday digests, anniversaries, and digital letters, but inconsistent presentation can make those messages feel like separate products.

**Why It Matters:**
- Email is a trust boundary for both admins and recipients. A consistent Dear Friends frame helps people understand why they received the message, who it came through, and that it belongs to the same quiet correspondence workflow.

**Evidence:**
- **Source:** Direct feature request to add branding to all Resend emails like the note-related email experience.
- **Strength:** Medium

**Hypothesis / Next Step:**
- Consistent branding across lifecycle emails should reduce recipient uncertainty and make reminders/address requests feel more legitimate. Revisit after seeing real email replies or support questions.

> **[CROSS-LOG]** Engineering implementation logged in `./docs/dev_journal.md` - see [CP-REFACTOR] | 2026-06-22: Shared branded shell for Resend emails.

---

### [PI-UX-FRICTION] | 2026-06-22: Dashboard utility controls need direct cleanup paths

**Observation:**
- A user reported three pragmatic dashboard frictions at once: globe pins did not reliably reveal location details when hovered directly, public address state input was too easy to mistype, and calendar/mail-by data needed relevance filtering plus delete controls for imported and pre-made dates.

**Why It Matters:**
- These are small control-surface issues, but they affect trust in the dashboard as a working address book: people need map feedback to feel accurate, address data to stay clean, and calendar imports to feel reversible.

**Evidence:**
- **Source:** Direct user request during dashboard polish.
- **Strength:** Medium

**Hypothesis / Next Step:**
- Stable map hover detection, constrained U.S. state selection, upcoming-only mail-by nudges, and visible delete actions should make the dashboard feel more controllable. Revisit destructive-action confirmation once real calendar usage grows.

> **[CROSS-LOG]** Engineering implementation logged in `./docs/dev_journal.md` - see [CP-MILESTONE] | 2026-06-22: Dashboard globe hover, state validation, and calendar deletion.

---
