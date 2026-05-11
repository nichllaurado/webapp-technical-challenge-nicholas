# VectorCam Interview Exercise

This repository contains a simplified but intentionally imperfect review & annotation dashboard built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and a small set of **shadcn/ui** components. The goal of the exercise is to evaluate your ability to reason about existing code, improve its structure, and design new features under realistic constraints.

## Running the project

1. Ensure you are using **Node.js 20.17.0**.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000` to access the app. The interview task lives under the `/interview` route.

## Context

VectorCam is used by entomologists and public health program managers to review and annotate specimen data collected in the field. This exercise focuses on the **web dashboard** portion of the system (not the mobile capture pipeline). A **mock API** (`/api/mock/records`) serves an in‑memory list of records and supports `GET` and `PATCH` operations. Data resets whenever the server restarts.

## Phase 1 – Analyse & Refactor

The code you find in the `interview` module has been intentionally implemented in a messy way. It mixes concerns, uses inconsistent naming, and places logic in awkward locations. Your job is to reason about the code, untangle it, and create a clean, maintainable architecture.

The key pieces are:

- **`RecordsContext.tsx`** – Provides a React context for fetching and updating records, along with an audit log of status changes.
- **`RecordList.tsx`** – Displays records and integrates filtering, summary counts and history.
- **Other UI components** – Eg. `RecordCard.tsx`, `RecordDetailDialog.tsx`, etc. (minimal skeleton) are provided.
- **Pages** – A landing page (`/`) and the main interview page (`/interview`).

Your tasks:

1. **Read and explain** what each part of the codebase does. Pay attention to variable names, how state flows through the app, and where responsibilities are mixed.
2. **Identify issues** with naming, state management, error handling, and separation of concerns.
3. **Refactor for clarity and maintainability** without over‑engineering:
   - Reorganise files logically (context, hooks, components, utilities).
   - Improve error and loading handling.
   - Isolate concerns into appropriate components or hooks.
   - Remove unused or redundant code where necessary.

### Reflection & architecture challenge (Phase 1 addendum)

Before you start refactoring, take a step back and assess the current file structure and where different responsibilities live. Then propose and implement improvements using industry‑standard patterns. Consider:

- What belongs in a **Context** vs a **Hook** vs a **Component** vs a **Utility**?
- Are there places where **state**, **derived state**, and **side‑effects** are mixed?
- Would introducing patterns like **Container/Presenter**, **Repository/Service** for API access, or **feature‑based folders** (e.g., `interview/`) improve clarity?
- Are naming and file boundaries consistent and discoverable?

Deliverables for Phase 1:

- Document your proposed architecture briefly (a short README section or comments), and update the codebase to reflect it.
- Apply at least two design patterns or conventions (examples: container/presenter separation, hooks for derived state, service layer for API calls, consistent feature‑based folder structure).
- Keep changes pragmatic - prefer small, reversible improvements that make responsibilities and data flow obvious.
- Provide the refactored code implementing your proposed structure and patterns.

## Phase 2 – Extend & Design (to be implemented by the candidate)

Implement the following functionality using the existing detail dialog dropdown and polish the user experience:

1. **Review actions (via dropdown)**
   - Use the Status dropdown in the detail dialog to set a record to Approved, Flagged, or Needs Revision.
   - Validation: require a non-empty note when setting status to Flagged or Needs Revision; note can be optional for Approved.
   - Persist updates via the mock API (PATCH) and ensure the UI reflects changes across the list, summary counts, and history.

2. **Filter**
   - The status filter is scaffolded; ensure it reliably filters the list.
   - Keep results consistent after updates (e.g., a record changing status may leave the current filtered view).
   - Make the control accessible and obvious (clear default and labels).

3. **Summary**
   - Display counts per status (Pending, Approved, Flagged, Needs Revision).
   - Keep counts accurate as records change.

4. **History**
   - Append an entry when a record’s status changes: include timestamp, from → to, and any note.
   - Present entries in a readable, scrollable list. Briefly note how you’d handle large logs or persistence in production; no implementation required.

5. **(Optional) Pagination & Concurrency**
   - If you choose, implement server-side pagination and optimistic concurrency as described in the Acceptance Criteria below. This is optional unless your interviewer asks for it.

### Acceptance criteria (for consistent evaluation)

- Review actions via dropdown:
  - Selecting Approved, Flagged, or Needs Revision updates the record’s `status`.
  - Validation: For Flagged/Needs Revision, a non-empty `note` is required; show inline validation feedback and block save when missing.
  - Persistence: On save, perform PATCH to the mock API; on success, update local state and ensure the list, summary counts, and history reflect the change.
  - UX: Keep the dialog responsive; show a lightweight success/failure message (toast or inline) and close the dialog only on success.
- Filter:
  - Filtering by status hides non-matching records and remains correct after updates (e.g., records changing status may leave/enter the current view).
  - Default state: “All” clearly indicated; label and focus states meet accessibility expectations.
  - Behavior: Changing the filter does not reset selection or lose scroll position unnecessarily.
- Summary:
  - Counts per status (Pending, Approved, Flagged, Needs Revision) are correct and update reactively when records change.
  - Rendering is robust to empty states (e.g., zero counts) and large numbers.
- History:
  - Each status change appends an entry containing: `record id`, human-readable `timestamp`, `previous → new` status, and `note` (if provided).
  - The log is readable and scrollable when long; clearing the log empties only in-memory entries (no persistence required).
  - Ordering is most-recent first or clearly indicated; time format is locale-friendly.
- Tests:
  - Unit: cover at least (a) successful update state transition and (b) validation failure preventing persistence.
  - Component: simulate dialog interactions (status selection + note entry), assert validation messaging for missing notes, perform a mocked successful save, and verify list/summary/history reflect the change.
  - Optional: add a small test for filter behavior correctness after an update.
- Optional (only if implemented):
  - Pagination: Implement server-driven pagination with `page` (1-based) and `limit` query params.
    - Server behavior: `GET /api/mock/records?page&limit` responds with `{ records, totalCount }`, where `records` is the current page slice and `totalCount` is the total number of records across all pages.
    - Client behavior: Render Prev/Next controls; disable Prev on `page === 1` and Next when `(page * limit) >= totalCount` or when the next page is empty.
    - UI behavior: Show empty-state messaging for pages with no results and keep the summary/filter consistent.
    - Example response: `{ records: RecordItem[], totalCount: number }`
  - Optimistic concurrency: Each record includes a monotonically increasing `version`.
    - Client behavior: When saving, send the current `version` with the PATCH request body; update the UI optimistically.
    - Server behavior: If the server detects the client's `version` is stale, it responds with `409 Conflict` and a `serverRecord` containing the latest data.
    - UI behavior: On 409, revert the optimistic change (or refresh the record), surface a clear message, and offer to retry/merge.
    - Example request: `{ id, status, note, version }`
    - Example 409 response: `{ error: "version_conflict", serverRecord: { id, status, note, version } }`

## UI/UX

Keep this simple and creative. Make small, presentational tweaks to improve clarity and aesthetics without changing functionality. Suggested directions (pick any):

- Refine spacing/typography for clearer hierarchy.
- Add subtle hover or shadow to interactive elements.
- Improve loading/error/empty state visibility (copy and tone).
- Use existing UI primitives and variants; avoid big rewrites.
- Use additional shadcn components as needed.

Constraints:

- Do not change behavior or data flow—purely visual polish.
- You’re free to be creative; explanations of your choices are welcome.
- You may use any color theme you prefer. Dark/light modes or custom palettes are welcome as long as readability is maintained.

## Implementation notes

- The mock API is in `src/app/api/mock/records/route.ts`. You will implement GET pagination (`page`, `limit`) and PATCH concurrency (`version` with 409 on conflict).
- The main review UI is under `src/app/interview/*`. `RecordList.tsx` currently wires together filter, summary, list, history, and the detail dialog without pagination UI; you will add it in Phase 2.

The following pieces are deliberately not implemented and are part of Phase 2:

- Server-side pagination on `GET /api/mock/records` (page, limit) and client navigation controls.
- Optimistic concurrency with `version` checks on `PATCH /api/mock/records` (including 409 conflict handling and user-visible resolution).

You will design and implement these, including minimal tests to validate the data flow and error handling.

- Shared UI components live in `src/components/ui/*` and expose typed variants via class-variance-authority.
- Use the provided context and hooks for data flow; prefer small, focused components or hooks for derived state.

---

Remember, the goal is to demonstrate clear reasoning, good software design, and thoughtful tradeoffs. Feel free to ask questions.

---

# My Phase 1 Architecture & Implementation

## Issues With The Codebase & Solutions:

- RecordList has too many responsibilities. Currently RecordSummary is handling data fetching, computing status summaries, rendering filter UI, displaying the card grid, managing dialog state, and showing the history log all in one place. This is the biggest need for separation of concerns. A simple fix would be to remove the duplicate code from RecordList and use RecordSummary instead. In the current state RecordList is a god component as it is already fetching, rendering the list of records, summary, and history. RecordSummary could be reused elswhere in the app making the codebase more modular.

- In RecordContext, there are two names for everything: abbreviated internal (data, busy, err, log, doUpdate, reLoad, purgeLog) vs descriptive public (records, loading, error, history, updateRecord, refresh, clearHistory). Simple fix would be to replace internal naming w public names.

- No unique key for history entries. RecordHistoryEntry.id is the record id, not an entry id. Simple fix would be adding entryId as a unique key to RecordHistoryEntry type.

- RecordsContext makes fetch calls to the api. The context should only manage react state. An Api service layer script could be added to make requests for RecordsContext. New directory for services with recordsApi.ts could manage http requests.

- Logic for counting records of each status type is present in RecordSummary and RecordList. This could be turned into a hook for derived state.

- HistoryLog mixes data access and rendering. A container/presenter split should be applied here. The fix would be to create HistoryLogView.tsx to act as presenter and make HistoryLog the container component.

- The useRecords hook is unused. All components import directly from the context file. The hooks directory has no function at runtime. All uses of useRecords should import from hooks/ dir to maintain consistency.

- Error handling in RecordsContext is slightly flawed. doUpdate both sets context error state and throws so the error shows up twice. 

# Phase 2 Implementation:

- Review Actions are funcitonal.

- Filter is functional.

- Summary is updated in realtime.

- History Log is functional.

- Pagination is implemented with limit of 6 record cards per page.