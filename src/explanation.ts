import { ValidationResult } from './types';
import { formatTime, VALIDATION_ERRORS, BOOKING_CONFLICT_PREFIX } from './validation';

export interface ExplanationInput {
  roomName: string;
  start: number;
  end: number;
  currentTime: number;
  validation: ValidationResult;
}

export type ExplanationResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

// The adapter only narrates the checker's verdict; it never decides availability itself.
export interface ExplanationAdapter {
  explain(input: ExplanationInput): ExplanationResult;
}

function isExplanationInput(value: unknown): value is ExplanationInput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ExplanationInput>;
  return (
    typeof v.roomName === 'string' && v.roomName.length > 0 &&
    typeof v.start === 'number' && Number.isFinite(v.start) &&
    typeof v.end === 'number' && Number.isFinite(v.end) &&
    typeof v.currentTime === 'number' && Number.isFinite(v.currentTime) &&
    typeof v.validation === 'object' && v.validation !== null &&
    typeof (v.validation as ValidationResult).isValid === 'boolean'
  );
}

function explainFailure(input: ExplanationInput): string {
  const { roomName, start, end, currentTime, validation } = input;
  const error = validation.error ?? '';
  const duration = end - start;

  if (error.startsWith(VALIDATION_ERRORS.intervalBounds)) {
    return `${roomName} cannot be checked for ${formatTime(start)} - ${formatTime(end)}: the request must have a start before the end, with both inside the day (00:00 - 24:00).`;
  }
  if (error.startsWith(VALIDATION_ERRORS.futureStart)) {
    return `${roomName} is unavailable for ${formatTime(start)} - ${formatTime(end)}: bookings must start strictly after the current demo clock (${formatTime(currentTime)}).`;
  }
  if (error.startsWith(VALIDATION_ERRORS.maxDuration)) {
    return `${roomName} is unavailable for ${formatTime(start)} - ${formatTime(end)}: the requested duration is ${duration} minutes, which exceeds the 120-minute maximum.`;
  }
  if (error.startsWith(VALIDATION_ERRORS.blockedRoom)) {
    return `${roomName} is unavailable: the room is marked as blocked (e.g. under maintenance) and cannot be booked at any time.`;
  }
  if (error.startsWith(BOOKING_CONFLICT_PREFIX)) {
    return `${roomName} is unavailable for ${formatTime(start)} - ${formatTime(end)}: ${error} Bookings may touch at endpoints but never overlap.`;
  }
  return `${roomName} is unavailable for ${formatTime(start)} - ${formatTime(end)}: ${error}`;
}

export const mockExplanationAdapter: ExplanationAdapter = {
  explain(input: ExplanationInput): ExplanationResult {
    if (!isExplanationInput(input)) {
      return { ok: false, error: 'Explanation request was malformed.' };
    }
    const { roomName, start, end, currentTime, validation } = input;
    if (validation.isValid) {
      return {
        ok: true,
        text: `${roomName} is available from ${formatTime(start)} to ${formatTime(end)}. All booking rules passed: valid time bounds, a start after the demo clock (${formatTime(currentTime)}), a duration of at most 120 minutes, the room is not blocked, and no existing booking overlaps this window.`,
      };
    }
    return { ok: true, text: explainFailure(input) };
  },
};
