# PLANNING_COMPLETE.md
## AI Discovery Workshop App — Phase 0 Planning Reference

> **Status: APPROVED FOR DEVELOPMENT**
> This document consolidates all 10 planning artifacts. It is the single reference document for the build.
> Do not modify without versioning the change below.

---

## Document Version History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-05-23 | Initial planning complete. All 10 artifacts produced. |
| 1.1 | 2026-05-23 | Pre-Sprint 1 decisions resolved (see below). |

---

## Part 1 — Key Decisions Locked

| Decision | Value | Artifact |
|---|---|---|
| Frontend | React + Vite, Tailwind CSS, shadcn/ui | A0 |
| State | Zustand (client) + React Query (server) | A0 |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) | A0 |
| Serverless | Azure Functions (Python) | A0 |
| AI model | Azure OpenAI GPT-4.1 — server-side only | A0 |
| Canvas | tldraw with custom UseCaseCard shape | A0, A5 |
| Doc generation | python-pptx + python-docx + openpyxl | A0, A6 |
| File storage | Azure Blob Storage, presigned URLs | A0, A6 |
| Hosting | Azure Static Web Apps | A0 |
| Auth | Supabase Auth; magic link first; Microsoft OAuth in Sprint 8 | A0, A8 |
| Companies | Many engagements per company allowed | A1 |
| Canvas card arrival | Auto-appear in real-time staging area on participant submit | A5 |
| Azure AD OAuth | Not yet provisioned — Sprint 1 setup task | A8 |
| Canvas coord system | 1200×1200px matrix; X=feasibility, Y=value (inverted) | A5 |
| Staging area | Right of matrix: x=700–1200 | A5 |
| Score interpolation | Linear mapping from pixel coords to 0–100 score | A5 |
| Snapshot cadence | Every 5 min (periodic) + session close + manual | A5 |
| Debounce on drag | 800ms trailing per card | A5 |
| AI token param | ALWAYS `max_completion_tokens` — NEVER `max_tokens` | A0, A6 |
| RLS resolution table | `engagement_participants` — central to all policies | A2 |
| Service role key | Azure Functions use service_role; never expose to frontend | A2, A9 |

---

## Part 2 — Schema Summary

### Tables (20 total)

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users; role, company_id, display name |
| `companies` | One per client organisation |
| `engagements` | One per client project; scoped to company |
| `engagement_participants` | Junction: profiles ↔ engagements with per-engagement role |
| `surveys` | Pre-workshop survey definitions |
| `survey_questions` | Individual questions per survey |
| `survey_responses` | One row per participant per survey (response header) |
| `question_answers` | One row per question per response |
| `workshop_sessions` | Live facilitation session; unique per engagement |
| `use_cases` | Core entity; all use case data |
| `canvas_position_history` | Append-only drag audit log |
| `canvas_snapshots` | Immutable tldraw document JSON snapshots |
| `use_case_scores` | Value + feasibility scores per use case per scorer |
| `roi_inputs` | Financial assumptions per use case |
| `roi_outputs` | Calculated DCF results per use case |
| `roadmap_items` | Use cases on the roadmap with horizon and order |
| `business_cases` | AI-generated business case sections per engagement |
| `output_exports` | Generated file log with Azure Blob URL |

### Enums

`user_role` · `engagement_status` · `question_type` · `use_case_status` · `canvas_zone` · `roadmap_horizon` · `export_format` · `export_status`

### Key Constraints

- `workshop_sessions` UNIQUE on `engagement_id` (one session per engagement)
- `engagement_participants` UNIQUE on `(engagement_id, profile_id)`
- `survey_responses` UNIQUE on `(survey_id, profile_id)`
- `question_answers` UNIQUE on `(response_id, question_id)`
- `roi_inputs` UNIQUE on `use_case_id`
- `roadmap_items` UNIQUE on `(engagement_id, use_case_id)`
- `use_case_scores` UNIQUE on `(use_case_id, scored_by)`

---

## Part 3 — RLS Access Matrix

| Table | Consultant | Client Lead | Participant | Azure Functions |
|---|---|---|---|---|
| profiles | own + engagement members | own | own | service_role bypass |
| companies | all they created | read their company | — | bypass |
| engagements | full CRUD | read only | read only | bypass |
| engagement_participants | full CRUD | read own | read own | bypass |
| surveys | full CRUD | read published | read published | bypass |
| survey_questions | full CRUD | read | read | bypass |
| survey_responses | read all | — | own row CRUD | bypass |
| question_answers | read all | — | own CRUD | bypass |
| workshop_sessions | full CRUD | read | read | bypass |
| use_cases | full CRUD | read | insert + read | bypass |
| canvas_position_history | read + insert | — | — | bypass |
| canvas_snapshots | full CRUD | read | — | bypass |
| use_case_scores | full CRUD | read | — | bypass |
| roi_inputs | full CRUD | read | — | bypass |
| roi_outputs | full CRUD | read | — | bypass |
| roadmap_items | full CRUD | read | — | bypass |
| business_cases | full CRUD | read (approved only) | — | bypass |
| output_exports | full CRUD | read (complete only) | — | bypass |

---

## Part 4 — Route Map

### Auth Routes
| Path | Component |
|---|---|
| `/login` | `LoginPage` |
| `/auth/callback` | `AuthCallbackPage` |
| `/auth/magic` | `MagicLinkLandingPage` |

### Console Routes (Consultant)
| Path | Component |
|---|---|
| `/console` | `ConsoleDashboardPage` |
| `/console/engagements/new` | `EngagementCreatePage` |
| `/console/:engagementId` | `EngagementDetailPage` |
| `/console/:engagementId/participants` | `ParticipantsPage` |
| `/console/:engagementId/survey` | `SurveyBuilderPage` |
| `/console/:engagementId/survey/responses` | `SurveyResponsesPage` |
| `/console/:engagementId/brief` | `FacilitatorBriefPage` |
| `/console/:engagementId/canvas` | `FacilitatorCanvasPage` (full-screen, no layout) |
| `/console/:engagementId/use-cases` | `UseCaseRegistryPage` |
| `/console/:engagementId/scoring` | `ScoringMatrixPage` |
| `/console/:engagementId/roi` | `ROICalculatorPage` |
| `/console/:engagementId/business-case` | `BusinessCasePage` |
| `/console/:engagementId/roadmap` | `RoadmapGeneratorPage` |
| `/console/:engagementId/exports` | `ExportsPage` |
| `/console/settings` | `SettingsPage` |

### Session Routes (Participant / Client Lead)
| Path | Component |
|---|---|
| `/session/join` | `SessionJoinPage` |
| `/session/:code` | `SessionLandingPage` |
| `/session/:code/survey` | `SurveyCompletionPage` |
| `/session/:code/submit` | `UseCaseSubmitPage` |
| `/session/:code/outputs` | `OutputViewerPage` |

---

## Part 5 — Azure Functions Summary

| Function | Trigger | AI Call | Est. Cost/Call | Sprint |
|---|---|---|---|---|
| `GenerateFacilitatorBrief` | HTTP POST | GPT-4.1 | ~$0.06 | 3 |
| `EnrichUseCase` | HTTP POST | GPT-4.1 | ~$0.01 | 5 |
| `GenerateBusinessCase` | HTTP POST | GPT-4.1 | ~$0.18 | 7 |
| `GenerateRoadmapNarrative` | HTTP POST | GPT-4.1 | ~$0.06 | 7 |
| `CalculateROI` | HTTP POST | None (Python DCF) | Negligible | 6 |
| `ExportToPowerPoint` | HTTP POST | None (python-pptx) | ~$0.002 | 8 |
| `ExportToWord` | HTTP POST | None (python-docx) | ~$0.001 | 8 |
| `ExportToExcel` | HTTP POST | None (openpyxl) | ~$0.001 | 8 |

**Critical rule for all GPT-4.1 calls:** Use `max_completion_tokens`, NEVER `max_tokens`.

---

## Part 6 — Sprint Plan

| Sprint | Name | Complexity | Key Risk | DoD Summary |
|---|---|---|---|---|
| 1 | Foundation & Auth | M | Azure AD timing | Consultant can sign in, create engagement. RLS verified. |
| 2 | Survey Builder & Invites | M | Join code uniqueness | Survey built, published, participants invited and authenticated. |
| 3 | Pre-Survey & Facilitator Brief | L | Azure OpenAI quota | Survey completed by participants; brief generated in <45s. |
| 4 | Live Canvas & Real-Time Submission | L | tldraw compatibility | 5 concurrent participants submit; cards appear on canvas in <2s. |
| 5 | Canvas Persistence & Scoring | M | Debounce rate limits | Scores write correctly on card drop; canvas restores after refresh. |
| 6 | ROI Calculator | M | IRR edge cases | 3 use cases calculated; comparison table and charts render. |
| 7 | Business Case & Roadmap | L | GPT output quality | Business case generated in <60s; roadmap drag-drop saves. |
| 8 | Exports, Client Portal & Hardening | L | python-pptx fidelity | All 3 formats download; client lead sees read-only portal. |

---

## Part 7 — Pre-Sprint 1 Decisions (All Resolved)

| Decision | Resolution |
|---|---|
| Custom domain | None — Azure Static Web Apps default URL will be used. Update if domain is acquired later. |
| Supabase region | **East US** — applies to both Dev and Prod projects. |
| Supabase project count | **Separate Dev and Prod projects** — two projects created from Sprint 1. |
| Presigned URL expiry | **30 days** — update `AZURE_BLOB_SAS_EXPIRY_HOURS=720` in Function App Settings. |

---

## Part 8 — Top Risks

| Risk | Severity | Action |
|---|---|---|
| Azure OpenAI quota too low | High | Request quota increase before Sprint 3 starts; allow 2 weeks |
| Azure Function cold starts on Consumption plan | Medium | Pre-warm on page load; upgrade to Premium plan before first client |
| tldraw license verification | Medium | Verify MIT license on npm package before Sprint 4 |
| Supabase Realtime message loss under load | Medium | Add 30s polling reconciliation in `useCanvasSync` |
| python-pptx template fidelity | Medium | Build and test `.pptx` template early in Sprint 8 |
| Client data in Azure OpenAI API calls | High | Confirm Azure OpenAI data processing terms with client before engagement 1 |

---

## Part 9 — Branding Tokens

| Token | Value |
|---|---|
| Primary | `#330662` (Dark Violet) |
| Accent | `#8B78FA` (Light Violet) |
| Alert | `#971B33` (Red — use sparingly) |
| Background | `#F2F2F2` (Light Gray) |
| Surface | `#FFFFFF` |
| Text Primary | `#000000` |
| Text on Dark | `#FFFFFF` |
| Font | Arial |

Never use blue, teal, or navy.

---

## Part 10 — Coding Constitution Quick Reference

> Full detail in the planning document. This is the checklist version.

- Feature-first folder structure: `src/features/<name>/{components,hooks,utils,types.ts,index.ts}`
- Named exports only for all components (default exports for route-level pages only)
- No data fetching inside components — hooks only
- No Azure Function URLs in components — service layer only
- No inline styles — Tailwind only
- No `useEffect` for data fetching — React Query only
- No `any` type — use `unknown` and narrow
- Props interfaces: `I` prefix + `Props` suffix (e.g. `IUseCaseCardProps`)
- Data interfaces: `I` prefix (e.g. `IEngagement`)
- Every hook returns `{ data, isLoading, error, ...mutations }`
- Every new Supabase table has RLS enabled
- Every Azure Function has Pydantic input validation
- Azure OpenAI: `max_completion_tokens` always — `max_tokens` never
- Prompts live in `prompts.py` — never inline in `service.py`
- `__init__.py` does exactly 4 things: parse, call service, return
- Components under 150 lines — split if larger

---

*Planning complete. Awaiting approval to begin Sprint 1.*
