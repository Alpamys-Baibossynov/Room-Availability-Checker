# Project memory

## Product intent & audience

- Smart Campus room availability checker: students/staff find and request campus rooms by time, equipment, and type.
- Booking is client-side only; no backend, auth, database, or persisted booking creation. Bookings append to in-memory state.

## Brand personality & voice

- Not yet inferred beyond `.bolt/prompt` global directives (beautiful, production-worthy, non-cookie-cutter).

## Visual design & UX direction

- UI surface: `src/RoomChecker.tsx` — filter sidebar + room catalog grid + selected-room status panel + simulated 150 ms async refresh + booking confirmation via `alert()`.
- Preserve existing UI exactly; do not alter layout or interaction model.
- Icons via `lucide-react`; styling via Tailwind CSS; imports via `@/` alias to `src/`.

## Decisions, constraints & rationale

- Acceptance criteria must stay intact:
  - AC1: reject `start >= end` and past-time requests (demo clock = 9:00 AM from `src/data.ts`).
  - AC2: reject durations > 120 minutes.
  - AC3: reject blocked rooms.
  - AC4: reject overlapping bookings; endpoint-touching bookings are allowed.
  - AC5/AC6: fixture data (`INITIAL_ROOMS`) must not be mutated.
- Key files:
  - Logic: `src/validation.ts` (`validateBooking`, `filterRooms`, `formatTime`).
  - UI: `src/App.tsx` (room state + booking handler), `src/RoomChecker.tsx` (full interface).
  - Types: `src/types.ts` (`Room`, `Booking`, `ValidationResult`, `FilterOptions`).
  - Fixtures: `src/data.ts` (`DEMO_CURRENT_TIME`, `INITIAL_ROOMS`).
  - Tests: `src/validation.test.ts` (covers AC1–AC4, filter rules, data preservation).
- Inspection-only pass completed; no files changed this turn.

## Open questions & assumptions

- Maintainability issues flagged for future refactor:
  1. Validation logic runs in two divergent paths (`RoomChecker.tsx` refresh effect + `filterRooms`), risking drift and loss of error reasons.
  2. `RoomChecker.tsx` mixes filtering state, simulated async, hardcoded equipment literals, and `alert()` confirmation in one component.
  3. `selectedRoomId` not reconciled against filtered list — stale selection can describe an invisible room.
- Recommended refactor pattern (when work is authorized): composable pure validation predicates (Specification-style), one per AC, shared by both call sites. No Singleton/Factory/class hierarchies; no backend/auth/persistence layers.
- Assume user will approve a follow-up implementation pass before any file changes.