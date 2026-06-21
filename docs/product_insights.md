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
