import type { Room, Booking, ValidationResult } from './types';

/** ---- Result constructors ---- */

function fail(reason: string): ValidationResult {
  return { ok: false, reason };
}

const PASS: ValidationResult = { ok: true };

/** ---- Boundary guard ---- */

/**
 * Returns a failure if `value` falls outside [min, max], else PASS.
 * Produces a human-readable message using the supplied label.
 */
function checkBounds(
  value: number,
  min: number,
  max: number,
  label: string,
): ValidationResult {
  if (value < min) {
    return fail(`${label} cannot be before ${minutesToLabel(min)}.`);
  }
  if (value > max) {
    return fail(`${label} cannot be after ${minutesToLabel(max)}.`);
  }
  return PASS;
}

/** ---- AC validators ---- */

/**
 * AC1: Accept only when 0 <= start < end <= 1440 and start is after current time.
 */
export function validateInterval(
  start: number,
  end: number,
  currentMinutes: number,
): ValidationResult {
  if (isNaN(start) || isNaN(end)) {
    return fail('Please enter valid numeric times.');
  }
  const startBounds = checkBounds(start, 0, 1440, 'Start time');
  if (!startBounds.ok) return startBounds;

  const endBounds = checkBounds(end, 0, 1440, 'End time');
  if (!endBounds.ok) return endBounds;

  if (start >= end) {
    return fail('Start time must be earlier than end time.');
  }
  if (start <= currentMinutes) {
    return fail(
      `Start time must be after the current campus time (${minutesToLabel(currentMinutes)}).`,
    );
  }
  return PASS;
}

/**
 * AC2: Reject bookings longer than 120 minutes.
 */
export function validateDuration(start: number, end: number): ValidationResult {
  if (end - start > 120) {
    return fail('Bookings cannot be longer than 120 minutes.');
  }
  return PASS;
}

/**
 * AC3: Reject when the room is blocked.
 */
export function validateRoom(room: Room): ValidationResult {
  if (room.blocked) {
    return fail(`${room.name} is currently blocked and unavailable for booking.`);
  }
  return PASS;
}

/**
 * AC4: Reject any interval that overlaps an existing booking.
 * Touching endpoints are allowed (e.g. 10:00–11:00 and 11:00–12:00 don't overlap).
 */
export function validateOverlap(
  roomId: string,
  start: number,
  end: number,
  bookings: Booking[],
): ValidationResult {
  const conflicting = bookings.find(
    (b) => b.roomId === roomId && start < b.end && end > b.start,
  );
  if (conflicting) {
    return fail(
      `Overlaps existing booking by ${conflicting.bookedBy} (${minutesToLabel(conflicting.start)}–${minutesToLabel(conflicting.end)}).`,
    );
  }
  return PASS;
}

/** ---- Sequential runner ---- */

/**
 * Runs validators in order, returning the first failure or PASS.
 * Eliminates the repeated `if (!r.ok) return r` pattern.
 */
function runChecks(checks: (() => ValidationResult)[]): ValidationResult {
  for (const check of checks) {
    const result = check();
    if (!result.ok) return result;
  }
  return PASS;
}

/**
 * Runs all acceptance criteria and returns the first failure or an OK.
 * AC5: This is a pure check — it never mutates booking data.
 */
export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  currentMinutes: number,
  bookings: Booking[],
): ValidationResult {
  return runChecks([
    () => validateInterval(start, end, currentMinutes),
    () => validateDuration(start, end),
    () => validateRoom(room),
    () => validateOverlap(room.id, start, end, bookings),
  ]);
}

/** ---- Formatting helpers ---- */

export function minutesToLabel(min: number): string {
  if (min === 1440) return '24:00';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "HH:MM" → minutes. Returns NaN on bad input. */
export function timeInputToMinutes(value: string): number {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return NaN;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 24 || m < 0 || m > 59) return NaN;
  // Only 24:00 is a valid hour-24 time (maps to 1440, the end-of-day boundary)
  if (h === 24 && m !== 0) return NaN;
  return h * 60 + m;
}
