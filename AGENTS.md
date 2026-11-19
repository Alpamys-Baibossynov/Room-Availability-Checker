## Project
Smart Campus room availability checker (React + TypeScript + Vitest) using local fictional data (`src/data.ts`).

## Constraints
- Preserve existing UI behavior, responsiveness, and acceptance criteria AC1–AC6.
- No backend, login/authentication, database, or external persistence.
- All rooms and bookings are fictional; never add real personal data (names, emails, etc.).
- Never commit, hardcode, or include secrets, API keys, or credentials (keep them out of source and tests).
- No external deployments and no outbound network calls; the app runs fully client-side.
- Do not weaken, delete, or break existing assertions in `src/validation.test.ts`.

## Engineering rules
- Prefer pure functions and minimal, targeted changes.
- Use at most 1 justified pattern: composable pure validation rules behind a single module boundary in `src/validation.ts`.
- Do NOT introduce unnecessary patterns (no Singleton, Factory, Strategy, Adapter, or class hierarchies).
- Do not mutate booking fixtures (`INITIAL_ROOMS` or booking arrays/objects); keep responsive desktop/mobile UI feedback intact.

## Verification
- Run the full test suite and confirm it passes BEFORE proposing acceptance.
- Run existing tests and add focused regression tests for: past time, reversed interval (`start >= end`), 121-minute duration, blocked room, overlap vs. touching endpoints, and unchanged fixtures.
- Report changed files, rationale, and exact test command/output evidence.