# secondLook -- Project Audit

**Date:** 2026-10-14
**Auditor:** Automated Phase 1 audit

---

## 1. Existing Architecture

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + Vite 8 + React Router 7 | SPA, no SSR |
| Backend | Node.js + Express 4 | CommonJS modules |
| Database | MongoDB Atlas via Mongoose 9 | Single cluster |
| AI | Google Gemini via `@google/genai` | `gemini-1.5-flash` hardcoded |
| File parsing | `pdf-parse`, `mammoth` | In-memory buffers |
| Auth | JWT (jsonwebtoken) + bcryptjs | 30-day tokens |
| Uploads | Multer (memory storage) | No GridFS, files discarded after parsing |
| Styling | Vanilla CSS + inline JS styles | Dark glassmorphism theme |
| Icons | None (emojis used) | Violates brand rules |

### Directory layout

```
backend/
  config/db.js
  controllers/ (auth, candidate, recruiter)
  middleware/  (auth, error, upload)
  models/      (User, Resume, AnalysisReport, JobDescription)
  routes/      (auth, candidate, recruiter)
  services/    (geminiService, parserService, scoringService)
  server.js
  .env / .env.example

frontend/
  src/
    components/ (Navbar, Dropzone, ScoreGauge, KeywordBadges,
                 BulletOptimizer, DonutChart, SkillMatchBreakdown,
                 CategoryBarChart)
    context/    (AuthContext)
    pages/      (Login, Register, CandidateDashboard, RecruiterDashboard)
    services/   (api.js -- Axios instance)
    assets/     (hero.png, react.svg, vite.svg)
    index.css / App.css / App.jsx / main.jsx
  public/       (favicon.svg, icons.svg)
  index.html
  vite.config.js
```

---

## 2. Features That Already Work

1. **Authentication:** Register/Login with role selection (candidate/recruiter), JWT generation, `/api/auth/me` for session restoration.
2. **Resume upload and text extraction:** PDF via `pdf-parse`, DOCX via `mammoth`, memory-buffered.
3. **Gemini AI analysis:** Structured JSON response schema, fallback engine when API unavailable.
4. **Hybrid ATS scoring:** Weighted formula (40% keyword + 30% semantic + 20% impact + 10% formatting).
5. **Candidate dashboard:** Upload resume, view scores, keyword badges, bullet improvements, job feed, express interest.
6. **Recruiter dashboard:** Create job descriptions, batch-upload resumes, view candidate ranking table, inspect candidate fit modal.
7. **Role-based route guards:** Frontend `ProtectedRoute` + backend `authorizeRoles` middleware.
8. **Analysis history:** Candidates can view past analysis reports.

---

## 3. Problems in the ATS Scoring Engine

### 3.1 Pure keyword matching
`scoringService.calculateKeywordOverlap` tokenizes the JD into individual words, filters stop words, and checks substring presence in the resume. This means:
- "Web Development" is split into "web" and "development" -- common words that match almost anything.
- Multi-word skills ("REST API", "machine learning") are partially matched by accident.
- No synonym or alias handling (e.g., "JS" vs "JavaScript", "Node" vs "Node.js").

### 3.2 No skill taxonomy
The fallback engine hard-codes two skill lists (web-dev and data/python). There is no structured skill ontology, no category hierarchy, no synonym map.

### 3.3 AI scores used as black-box numbers
Gemini returns `semanticFitScore`, `impactScore`, `formattingScore` but these are opaque. There is no requirement-level evidence mapping. Scores cannot be explained to the user.

### 3.4 No separation of ATS readability vs job match
`overallScore` conflates document quality with job relevance. A well-formatted irrelevant resume can score high.

### 3.5 Fallback engine fabricates data
When Gemini is unavailable, the fallback invents experience entries, education, and contact information. This violates the "never fabricate" rule.

### 3.6 No caching or rate-limit protection
Every analysis calls Gemini. No hash-based cache, no retry with backoff, no concurrency limit. The 8-second timeout is too short for complex prompts.

---

## 4. Problems in Database Design and API Integration

### 4.1 No file persistence
Resume binary files are parsed in memory and discarded. Only `rawText` is stored. Re-download is impossible.

### 4.2 Applications embedded in JobDescription
`JobDescription.applications[]` embeds application data inside the job document. This will not scale, makes querying applications by candidate expensive, and prevents proper status tracking.

### 4.3 No Application model
There is no dedicated Application/Interest schema. Application status (applied, shortlisted, rejected) does not exist.

### 4.4 No CandidateProfile or RecruiterProfile
All user data is in the `User` model (name, email, password, role). No privacy settings, no profile data.

### 4.5 No Notification model
No in-app notifications exist.

### 4.6 No pagination
All queries use `.find()` without limit/skip. Will not scale.

### 4.7 No indexes
No custom indexes defined beyond Mongoose defaults.

### 4.8 Missing ownership checks
`getJobApplications` does not verify the recruiter owns the job. Any recruiter can view any job's applicants.

### 4.9 recruiter batch-scan sets candidateId to recruiterId
In `batchScanResumes`, the Resume document is created with `candidateId: recruiterId`, which is semantically wrong.

---

## 5. Security and Privacy Risks

| Risk | Severity | Location |
|---|---|---|
| `.env.example` contains real credentials | **Critical** | `backend/.env.example` |
| Hardcoded JWT fallback secret | High | `authController.js:14`, `authMiddleware.js:20` |
| In-memory user registry bypasses DB auth | High | `authController.js` |
| Auth middleware fabricates user on DB failure | Medium | `authMiddleware.js:30-36` |
| No rate limiting on any endpoint | Medium | All routes |
| No input sanitization | Medium | Controllers |
| Resume raw text exposed in recruiter API | Medium | `getJobApplications` populates `rawText` |
| CORS allows all origins | Medium | `server.js` |
| No CSRF protection | Low | SPA with JWT (acceptable) |
| Emojis in console logs | Low | Multiple files |

---

## 6. UI/UX Problems

1. **Dark glassmorphism theme** does not match the secondLook brand (warm off-white, light surfaces).
2. **No landing page** -- unauthenticated users are redirected to `/login`.
3. **No homepage hero** with product value proposition.
4. **All styles are inline JS objects** -- no design tokens, no reusable component library.
5. **No responsive breakpoints** -- flex layouts wrap but have no mobile-specific adjustments.
6. **Emojis used as icons** throughout (loading spinner text, console logs).
7. **No empty states** with proper illustrations.
8. **No loading skeletons**.
9. **No toast/notification system**.
10. **No accessible focus indicators**.
11. **Candidate and recruiter dashboards are single monolithic pages** with no navigation.
12. **Modal lacks keyboard trap and ARIA attributes**.
13. **No confirmation dialogs** for destructive actions.
14. **Product name** is "Smart Resume Analyzer" -- needs rebrand to "secondLook".

---

## 7. Prioritized Implementation Plan

### Phase 2: Brand Foundation and Landing Page
- Design tokens file (colors, typography, spacing, shadows)
- Logo SVG component with eye-glance animation
- Landing page with typing animation and logo-to-navbar transition
- Shared UI components (Button, Input, Card, Badge, ScoreRing, etc.)
- Updated Navbar with secondLook branding
- Fix `.env.example` to use placeholders only
- Remove emojis from all files
- Install `lucide-react` for icons

### Phase 3: Analysis Engine
- Skill taxonomy with categories, synonyms, and aliases
- Structured resume extraction with evidence mapping
- Separate ATS readability score from job-match score
- Configurable scoring weights
- Gemini prompt redesign with structured output validation
- Caching by input hash
- Exponential backoff and concurrency limiting
- Remove fallback data fabrication

### Phase 4: Backend and Database
- Application model with status workflow
- CandidateProfile and RecruiterProfile models
- Notification model
- Job model enhancements (status, structured fields)
- Ownership checks on all endpoints
- Pagination and indexes
- Security fixes

### Phase 5-9: See master prompt

---

## Resume Analysis Flow (Current)

```
1. Upload file (Multer memory buffer)
2. parseResumeBuffer() -- pdf-parse or mammoth
3. analyzeResumeWithGemini(resumeText, jobDescriptionText)
   -> Gemini API call with structured schema
   -> OR fallback engine (keyword presence check)
4. calculateHybridATSScore(resumeText, jdText, aiScores, aiKeywords)
   -> Keyword overlap (word tokenization)
   -> Weighted formula: 40% keyword + 30% semantic + 20% impact + 10% formatting
5. Save Resume + AnalysisReport to MongoDB
6. Return JSON response to frontend
```

**Core weakness:** Step 3 fallback fabricates data. Step 4 treats individual words as keywords with no semantic understanding. No caching. No evidence trail.
