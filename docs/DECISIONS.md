# secondLook -- Design Decisions Log

## D001: Keep Vanilla CSS instead of adding Tailwind
**Date:** 2026-10-14
**Decision:** Use vanilla CSS with CSS custom properties (design tokens) rather than adding Tailwind CSS.
**Rationale:** The existing project uses vanilla CSS and inline styles. Adding Tailwind would require migrating all existing styles and adds a build dependency. CSS custom properties provide the same design-token benefits with zero additional dependencies.

## D002: Use CSS FLIP technique instead of Framer Motion for landing animation
**Date:** 2026-10-14
**Decision:** Implement the landing page logo-to-navbar animation using pure CSS transforms and JavaScript FLIP (First, Last, Invert, Play) rather than adding Framer Motion as a dependency.
**Rationale:** Keeps the landing page JS bundle small so the animation starts instantly. Framer Motion adds ~30KB gzipped. The animation only runs once per session, so the added dependency is not justified. CSS transforms on `transform` and `opacity` are GPU-accelerated and meet the performance requirements.

## D003: Use `gemini-2.0-flash` as default model
**Date:** 2026-10-14
**Decision:** Default `GEMINI_MODEL` to `gemini-2.0-flash` (current Flash-class model).
**Rationale:** As of late 2026, `gemini-2.0-flash` is the recommended free-tier Flash model. The previous hardcoded `gemini-1.5-flash` may still work but the newer model offers better structured output support.

## D004: Store resume files as base64 in MongoDB instead of GridFS
**Date:** 2026-10-14
**Decision:** Store resume file buffers as base64 strings in the Resume document rather than implementing GridFS.
**Rationale:** Resume files are limited to 10MB. MongoDB documents support up to 16MB. For the initial implementation this is simpler and avoids GridFS complexity. If file sizes grow or storage becomes a concern, migration to GridFS is straightforward. Documented as a future improvement.

## D005: No OCR for scanned PDFs
**Date:** 2026-10-14
**Decision:** Do not implement OCR. Document the limitation.
**Rationale:** Pure-JS OCR solutions (Tesseract.js) require downloading ~15MB of language data at runtime and produce unreliable results. The zero-extra-service constraint prevents using cloud OCR APIs. Scanned PDFs will return a clear error message explaining the limitation.

## D006: Generate JWT_SECRET automatically on first run
**Date:** 2026-10-14
**Decision:** If `JWT_SECRET` is not set or is the placeholder value, generate a cryptographically secure random secret on server startup and log a warning to set it properly for production.
**Rationale:** Prevents the insecure hardcoded fallback secret while keeping the development experience smooth.

## D007: Inter font via Google Fonts CDN
**Date:** 2026-10-14
**Decision:** Load Inter font via a `<link>` tag in `index.html` pointing to Google Fonts CDN.
**Rationale:** Zero-config, no npm dependency needed, and the font is cached aggressively by the CDN. Tabular numerals are available via `font-variant-numeric: tabular-nums`.

## D008: Separate ATS readability from job-match scoring
**Date:** 2026-10-14
**Decision:** Split the single `overallScore` into two independent scores: ATS Readability (document quality, independent of any JD) and Job Match (skill/experience relevance to a specific JD). The combined overall score weights 30% ATS + 70% job match.
**Rationale:** A well-formatted but irrelevant resume should not score high on job match, and vice versa. Candidates and recruiters need to distinguish between resume quality and relevance.

## D009: Skill taxonomy with deterministic matching + AI evidence overlay
**Date:** 2026-10-14
**Decision:** Build a local skill taxonomy (90+ skills, 9 categories, aliases, and relationships) for deterministic matching. Use Gemini AI as an evidence overlay that provides requirement-level evidence mapping. The deterministic layer always produces a score; AI enriches it.
**Rationale:** Ensures consistent, reproducible scores even when the AI is unavailable. AI evidence adds nuance (e.g., recognizing skills from project descriptions) but never fabricates data.

## D010: In-memory caching for Gemini API responses
**Date:** 2026-10-14
**Decision:** Cache Gemini API responses in a process-level Map keyed by SHA-256 hash of inputs, with a 1-hour TTL and max 100 entries.
**Rationale:** Prevents duplicate API calls for the same resume+JD combination within a session. In-memory is sufficient for a single-process deployment. Redis would be needed for multi-process, but that violates the zero-extra-service constraint.

## D011: Exponential backoff with 3 retries for Gemini API
**Date:** 2026-10-14
**Decision:** Retry Gemini API calls up to 3 times with exponential backoff (2s, 4s, 8s) plus jitter. Timeout per request is 30 seconds.
**Rationale:** The free-tier Gemini API is rate-limited and occasionally returns transient errors. Backoff with jitter prevents thundering herd. 30s timeout is generous but necessary for complex structured output.
