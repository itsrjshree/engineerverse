# ENGINEERVERSE — FOUNDATION CONSTITUTION & ARCHITECTURAL RECORD
**Document Version:** 1.0.0 (V0 Foundation — Workstream 1)  
**Authority:** Shree Labs × Pritee AI  
**Canonical Public Hub:** `/engineerverse`  
**Canonical Production Identity:** `https://rjshree.com/engineerverse`  
**Status:** Locked Architectural Baseline

---

## 1. Product Identity

- **Platform Name:** `ENGINEERVERSE`
- **Creators:** `SHREE LABS × PRITEE AI`
- **Parent Entity / Creator:** Shree Labs | Rajshree (`rjshree.com`)
- **AI Collaborator:** Pritee AI
- **Canonical Public URL:** `https://rjshree.com/engineerverse`
- **Core Philosophy:**
  > *"Engineering isn't a degree. It's the instinct to solve what others learn to live with."*
- **Core Marketing Direction:**
  > *"Discover the Engineer Within You. Engineer What's Next."*
- **Platform Scope:** An evergreen, interactive engineering platform that celebrates engineering as a fundamental human way of thinking, analyzing, building, and solving societal friction — not merely an academic degree or branch.
- **Audience Inclusivity:** Built equally for working engineers, students, aspirants, school children, makers, entrepreneurs, educators, and curious non-engineers who love fixing and improving the world.

---

## 2. Evergreen Product Boundary

- **Perpetual Availability:** ENGINEERVERSE remains permanently accessible at `/engineerverse`.
- **Zero Shutdown:** There is **NO** post-campaign shutdown, expired state, or dead page.
- **Zero Event-Ended Dead Ends:** There is **NO** user-facing "campaign ended" screen, "September 16 mode", or "countdown to shutdown".
- **Zero Manual Relaunch:** ENGINEERVERSE does not need to be manually redeployed, re-engineered, or relaunched every year.
- **Two Presentation States Only:** The public product resolves into exactly two date-driven states:
  1. **Engineers' Day Experience (`engineers_day`):** Active strictly on September 15.
  2. **Normal Evergreen ENGINEERVERSE Experience (`evergreen`):** Active on every other date of the year (364 / 365 days).

---

## 3. September 15 IST Activation Contract

- **Activation Date:** September 15 of every year.
- **Authoritative Timezone:** India Standard Time (`IST` / `Asia/Kolkata` / `UTC+5:30`).
- **Exact Activation Window:**
  - **Start:** `September 15 00:00:00 IST` (equivalent to `September 14 18:30:00.000 UTC`).
  - **End:** `September 15 23:59:59.999 IST` (equivalent to `September 15 18:29:59.999 UTC`).
- **Automatic Transitions:**
  - At `September 15 00:00:00 IST`: UI automatically displays the Engineers' Day celebratory presentation.
  - At `September 16 00:00:00 IST`: UI automatically reverts to the normal evergreen experience.
- **Year-Independent Logic:** Date evaluation uses dynamic year resolution and IST normalization. The logic is valid for 2026, 2027, 2028, 2029, 2030, and all future years with zero code alterations.

---

## 4. Year Handling

- **Dynamic Derivation:** All year references in the UI and business layer are derived dynamically from the runtime date (`currentYear = istDate.getFullYear()`).
- **Zero Fixed 2026 Business Logic:** The string or number `2026` is never hardcoded as permanent business logic.
- **Appropriate Usages:**
  - Dynamic copyright statements: `© {currentYear} Shree Labs. All rights reserved.`
  - Dynamic edition markers on September 15: `Happy Engineers' Day {currentYear}`
  - Dynamic pledge contracts and verification certificates.

---

## 5. Future Annual Edition Extensibility

- **Extensibility Capability:** The architecture allows future annual editions (e.g., 2027, 2028) to introduce custom themes, banners, or special interactions via `registerAnnualEditionOverride(year, config)`.
- **Default Fallback:** If no annual override is registered for a future year, the system runs the standard Engineers' Day experience seamlessly.
- **Canonical Hub Unchanged:** The canonical public URL remains `/engineerverse`. The hub is never made dependent on a year-specific path such as `/engineerverse/2026`.

---

## 6. Separation: EV-001 → EV-060 vs. Campaign State

- **Critical Invariant:** `EV-001` through `EV-060` are **60 independent product feature contracts**.
- **Not Campaign Phases:** They are **NOT** campaign lifecycle stages, September phases, launch milestones, or date states.
- **Decoupled Engines:** The Feature Registry (`src/config/features.js`) and the Date/Campaign Presentation State Engine (`src/config/campaign.js`) are architecturally decoupled and must remain strictly separate.

---

## 7. Exact Feature Registry (EV-001 to EV-060)

The 60 contracted features with locked IDs and canonical names:

| ID | Canonical Name |
| :--- | :--- |
| **EV-001** | ENGINEERVERSE Core Experience |
| **EV-002** | Cinematic Opening |
| **EV-003** | Invisible Engineering Story |
| **EV-004** | Engineering DNA Experience |
| **EV-005** | Deterministic DNA Scoring Engine |
| **EV-006** | Engineering Dimensions |
| **EV-007** | Engineer Archetype Engine |
| **EV-008** | Engineering Legend Resonance |
| **EV-009** | AI Personality Interpretation |
| **EV-010** | Engineer Identity Card |
| **EV-011** | Identity Card Download |
| **EV-012** | Social Sharing |
| **EV-013** | Public Result Link |
| **EV-014** | QR Result Link |
| **EV-015** | Challenge a Friend |
| **EV-016** | Engineering Manifesto |
| **EV-017** | Engineering Poetry Mode |
| **EV-018** | Engineer Yourself / Future Engineer Mission |
| **EV-019** | Engineer a Problem |
| **EV-020** | The Problem Wall |
| **EV-021** | Problem Support / Engagement |
| **EV-022** | Problem Moderation |
| **EV-023** | Engineer Stories Wall |
| **EV-024** | Story Moderation |
| **EV-025** | Engineering Pledge |
| **EV-026** | Pledge Share Card |
| **EV-027** | Ask Pritee Engineering Edition |
| **EV-028** | Engineering Mentor Modes |
| **EV-029** | Debug the World |
| **EV-030** | Engineering Challenge Series |
| **EV-031** | Challenge Evaluation |
| **EV-032** | Challenge Leaderboard |
| **EV-033** | Engineer of the Day / Featured Engineer |
| **EV-034** | Visvesvaraya Legacy |
| **EV-035** | Engineering in India |
| **EV-036** | Engineering Discipline Explainers |
| **EV-037** | Public Profiles |
| **EV-038** | Guest Journey |
| **EV-039** | Authentication |
| **EV-040** | Saved Journey |
| **EV-041** | Firebase User Profile |
| **EV-042** | Admin Dashboard |
| **EV-043** | Admin Authorization |
| **EV-044** | Content Moderation |
| **EV-045** | Analytics |
| **EV-046** | AI Usage Controls |
| **EV-047** | Cloudinary Media Pipeline |
| **EV-048** | SEO Architecture |
| **EV-049** | Structured Data |
| **EV-050** | Sitemap / Robots |
| **EV-051** | OpenGraph / Social Metadata |
| **EV-052** | Dynamic Share Images |
| **EV-053** | Accessibility |
| **EV-054** | Responsive Architecture |
| **EV-055** | Performance / Core Web Vitals |
| **EV-056** | Security |
| **EV-057** | Privacy / Consent / Data Controls |
| **EV-058** | Evergreen Post-September Experience |
| **EV-059** | Launch State Management |
| **EV-060** | Future Annual Edition Architecture |

---

## 8. Feature Status Rules

- **Allowed Status Enum:**
  - `planned`: Feature contracted and specified.
  - `foundation`: Architectural groundwork laid.
  - `in_progress`: Active implementation in development.
  - `implemented`: Full code written and running.
  - `verified`: Passed independent audit/validation.
  - `blocked`: Progress impeded by an external dependency.
- **Strict Prohibition Against Premature Marking:** No feature may be marked `implemented` or `verified` merely because a placeholder component, route, or registry entry exists.
- **Current State at End of Workstream 1:** All 60 features remain in `planned` or `foundation` status and `unverified` state.

---

## 9. Exact 12 Engineering DNA Dimensions

The DNA scoring system evaluates exactly these 12 locked dimensions:

1. **Logical Thinking:** Deconstructing ambiguous situations into deterministic cause-and-effect components.
2. **Creative Problem Solving:** Inventing non-obvious combinations and lateral shortcuts when conventional methods fail.
3. **Systems Thinking:** Mapping feedback loops, hidden bottlenecks, dependencies, and second-order consequences.
4. **Innovation:** Challenging fundamental axioms to introduce paradigm shifts rather than incremental tweaks.
5. **Resourcefulness (Jugaad & Frugality):** Achieving 10x outcomes with 0.1x budget using scavenged parts, open tools, and grit.
6. **Risk Analysis:** Anticipating catastrophic edge cases, failover conditions, and safety margins before disaster strikes.
7. **Empathy:** Designing for human dignity, safety, ergonomics, and real lived user friction.
8. **Execution:** Translating whiteboard theories into ship-ready, robust, physical or digital artifacts.
9. **Curiosity:** An obsessive urge to understand how things actually work beneath the surface.
10. **Resilience (Debugging Grit):** Viewing failure as telemetry; tenaciously hunting obscure bugs across adversity.
11. **Automation Mindset:** Eliminating repetitive cognitive toil: *"If it happens twice, automate it."*
12. **Impact Orientation:** Measuring engineering worth by human lives uplifted and societal public good created.

*Architectural Principle:* The scoring engine is deterministic ("Algorithm decides"). AI is strictly an interpretive and explanatory layer ("AI explains").

---

## 10. Exact 10 Archetypes

The deterministic DNA model maps scores into exactly 10 locked archetypes:

1. **The Architect:** Sees systems where others see isolated chaos. Global topology mapping and bottleneck anticipation.
2. **The Builder:** Learns by making, soldering, and committing code. High-velocity tangible prototyping.
3. **The Explorer:** Driven by an insatiable hunger to look under the hood and question first principles.
4. **The Fixer:** Cannot ignore broken, leaking, or inefficient systems; immediate triage and pragmatic patches.
5. **The Visionary:** Solves problems humanity will stumble into tomorrow; long-horizon architectural moonshots.
6. **The Automator:** Ruthlessly eliminates routine manual toil through compounding pipelines and tools.
7. **The Creative Engineer:** Where rigorous mathematics meets playful imagination and expressive technology.
8. **The Resilient Debugger:** Treats failure as telemetry; infinite tenacity under fire and forensic analysis.
9. **The Human Engineer:** People first, technology second; radical empathy, universal accessibility, and ethical safeguards.
10. **The Impact Engineer:** Builds exclusively for societal scale, public good, and lasting human emancipation.

---

## 11. Engineering Discipline Taxonomy

ENGINEERVERSE natively supports all engineering disciplines. The centralized registry (`src/config/disciplines.js`) explicitly preserves support for at least these 17 disciplines individually:

1. **Civil Engineering** (`civil`)
2. **Mechanical Engineering** (`mechanical`)
3. **Electrical Engineering** (`electrical`)
4. **Electronics & Communication Engineering** (`electronics_communication`)
5. **Computer & Software Engineering** (`computer_software`)
6. **AI, Machine Learning & Data Engineering** (`ai_ml_data`)
7. **Chemical Engineering** (`chemical`)
8. **Aerospace & Aeronautical Engineering** (`aerospace_aeronautical`)
9. **Biomedical Engineering** (`biomedical`)
10. **Environmental Engineering** (`environmental`)
11. **Agricultural & Food Engineering** (`agricultural`)
12. **Automobile Engineering** (`automobile`)
13. **Industrial & Production Engineering** (`industrial_production`)
14. **Robotics & Mechatronics Engineering** (`robotics_mechatronics`)
15. **Materials & Metallurgical Engineering** (`materials_metallurgical`)
16. **Structural Engineering** (`structural`)
17. **Telecommunications Engineering** (`telecommunications`)

*Principle:* Grouping exists for UI simplicity, but each discipline remains representable individually. New disciplines can be registered via `registerDiscipline()`.

---

## 12. Audience Model

ENGINEERVERSE embraces universal inclusivity. A formal degree is **never** required:

- **Curious General Users / Everyday Solvers:** Anyone who takes things apart and fixes everyday friction.
- **School & College Students:** Discovering real engineering beyond textbook formulas.
- **Engineering Aspirants:** Exploring authentic problem-solving archetypes before career choices.
- **Practicing / Working Engineers:** Reigniting pride of craft and interdisciplinary collaboration.
- **Makers, Creators & Innovators:** Celebrating rapid physical prototyping, Jugaad, and open hardware.
- **Founders & Entrepreneurs:** Building scalable technological foundations to solve societal problems.
- **Educators & Mentors:** Equipping classrooms with living case studies of engineering ingenuity.

---

## 13. Canonical Product Terminology

To avoid ambiguity, all documentation, code, routes, and UI adhere to these canonical terms:

- **ENGINEERVERSE** (all caps; never EngineerVerse or Engineer-verse)
- **The Problem Wall** (unlimited, dynamic; never "10 Problem Wall" or "100 Problems")
- **Engineering DNA**
- **Engineer Identity Card**
- **Ask Pritee — Engineering Edition**
- **Engineer Stories Wall**
- **Engineering Pledge**
- **Engineering Challenge Series**
- **Engineer of the Day / Featured Engineer**
- **Visvesvaraya Legacy**
- **Engineering in India**

---

## 14. Product Information Architecture

The platform organizes into 6 primary conceptual pillars:

1. **Discover:** Engineering DNA diagnostic (12 dimensions, 10 archetypes, legend resonance).
2. **Identity:** Engineer Identity Card, customized manifesto, poetry mode, and verifiable public badges.
3. **Build:** The Problem Wall (unlimited community-submitted challenges), Future Engineer missions, and competitive engineering sprints.
4. **Humanity:** Invisible engineering narratives, community stories, and the ethical Engineering Pledge.
5. **Learn:** Ask Pritee — Engineering Edition (multi-mode AI mentor: Student, Engineer, Curious).
6. **Legacy:** Sir M. Visvesvaraya historical achievements and India’s engineering heritage.

---

## 15. V0 Definition

**V0 Foundation** is the verified, production-ready architectural foundation upon which features EV-001 through EV-060 can be built independently without requiring structural redesign.

V0 establishes:
- Secure dual-mode backend (Express locally, Vercel Serverless in cloud).
- Hardened Firebase/Firestore integration and rules.
- Pure JavaScript runtime (zero TypeScript).
- Opaque public sharing links and QR verification infrastructure.
- Zero-PII privacy-first analytics.
- Centralized configuration and automated invariant audit test suites.

---

## 16. What is Intentionally NOT Implemented in V0 Part 1

To maintain strict change discipline, the following are intentionally deferred:
- Individual feature implementations (EV-001 through EV-060).
- Fake users, mock leaderboards, fabricated telemetry counts, or simulated AI outputs.
- Year-bound shutdown pages or artificial campaign expiration logic.
- Unsolicited frontend redesigns or speculative UI rewrites.

---

## 17. Architecture Principles

1. **Dynamic over Hardcoded:** No static business assumptions or permanent 2026 values.
2. **Evergreen by Default:** September 15 is an activation window, not a shutdown horizon.
3. **IST Timezone Correctness:** Engineers' Day evaluated strictly in `Asia/Kolkata`.
4. **Decoupled Concerns:** Features ≠ Campaign dates; Auth ≠ Authorization; Ownership ≠ Visibility.
5. **Server-Side Security:** Sole admin (`rajshreeakm@gmail.com`) authenticated via server token verification.
6. **Honest Data:** Zero fabricated counters or fake social proof.
7. **Pure JavaScript:** Strict JS execution across frontend and backend. No TypeScript files.
8. **Vercel & Canonical Compatibility:** Verified edge rewrites and CORS headers for `rjshree.com/engineerverse`.

---

## 18. Public UX Principles

- **Sophisticated & Immersive:** Deep cosmic neutral palette (`#050510`), high contrast, crisp typography, and circuit accent motifs.
- **Anti-Slop:** Zero generic SaaS clichés, purple-blue gradient text, floating glassmorphic badges, or fake counters.
- **Zero Internal Leaks:** No internal EV IDs, scaffold tags, or developer status banners exposed to public visitors.

---

## 19. Launch & Discovery Context

- **Initial Launch Window:** September 15, with discovery ramp-up beginning days prior.
- **Pre-Activation Crawlability:** The production site must be deployable and crawlable before September 15.
- **Technical Discoverability:** Semantic HTML, JSON-LD structured data (`WebApplication`), OpenGraph tags, and sitemaps ensure visibility without promising artificial search ranking guarantees.

---

## 20. SEO Foundation Direction

- **Canonical Target:** Strictly `https://rjshree.com/engineerverse`.
- **Permanent Hub Identity:** Never convert the canonical hub to a year-specific path like `/engineerverse/2026`.
- **Entity Clarity:** Rich schema modeling for engineering discovery, problems, and historical legacy.

---

## 21. Repository Findings (Audit Baseline)

1. **Language:** Pure JavaScript (Vite 6, React 19, Tailwind CSS v4). Zero TypeScript files.
2. **Feature Registry:** All 60 features (EV-001 to EV-060) cataloged in `src/config/features.js` with all 21 contract fields, all unverified.
3. **Routing Typo:** `versel.json` was misnamed; renamed to `vercel.json` with CORS headers.
4. **Serverless Filename:** Percent-encoded `api/%5B...all%5D.js` corrected to `api/[...all].js`.
5. **Initialization TDZ:** `authService.isConfigured` access in `src/services/firebaseClient.js` was causing runtime crash on `rjshree.com`; guarded against TDZ ReferenceError.

---

## 22. Contradictions Discovered & Resolved

1. **Campaign State Model Contradiction:** Previous code had 3 states including a pre-launch countdown and post-September 16 "event ended" notice. **Resolved:** Consolidated strictly into 2 presentation states (`engineers_day` on Sept 15 IST, `evergreen` on all other dates).
2. **Mindset Dimension Count Discrepancy:** Previous audience file and validator checked for 11 dimensions. **Resolved:** Updated to assert all **12 locked DNA dimensions**.
3. **Public Exposure of Internal Phase:** `HeroSection.jsx` previously had a `Phase 0: Foundation` badge. **Resolved:** Removed internal scaffolding marker from public rendering.

---

## 23. Decisions Requiring Later Workstreams

1. **Workstream 2 (Backend & Vercel Gateway):** Complete serverless API endpoint testing and CORS verification for `https://rjshree.com` reverse proxy.
2. **Workstream 3 (Database & Auth):** Initialize server-side Firestore client and tighten `firestore.rules`.
3. **Workstream 4 (Pritee AI Gateway):** Validate Gemini 2.5 and OpenRouter fallback chain with circuit breaker.
4. **Workstream 5 (Client Routing & Deep Linking):** Wire browser URL pushState navigation for sub-paths under `/engineerverse/*`.

---

*Signed and Locked for V0 Foundation — Workstream 1.*
