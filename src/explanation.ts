import { ValidationResult } from './types';
import { formatTime, VALIDATION_ERRORS, BOOKING_CONFLICT_PREFIX } from './validation';

// Structured reason codes produced from the deterministic checker's verdict.
export type ReasonCode =
  | 'OK'
  | 'OUTSIDE_DAY_BOUNDS'
  | 'START_NOT_AFTER_CLOCK'
  | 'DURATION_EXCEEDS_MAX'
  | 'ROOM_BLOCKED'
  | 'BOOKING_CONFLICT'
  | 'OTHER';

export interface ExplanationFacts {
  roomLabel: string;
  startTime: number;
  endTime: number;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export type ExplanationResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

// The adapter only narrates the structured facts; it never decides availability itself.
export interface ExplanationAdapter {
  explain(facts: ExplanationFacts): ExplanationResult;
}

const REASON_CODES: ReasonCode[] = [
  'OK',
  'OUTSIDE_DAY_BOUNDS',
  'START_NOT_AFTER_CLOCK',
  'DURATION_EXCEEDS_MAX',
  'ROOM_BLOCKED',
  'BOOKING_CONFLICT',
  'OTHER',
];

const MAX_LABEL_LENGTH = 80;

// Labels are untrusted input: flattened to inert single-line text, never interpreted.
function sanitizeLabel(raw: string): string {
  const cleaned = raw.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > MAX_LABEL_LENGTH ? `${cleaned.slice(0, MAX_LABEL_LENGTH - 1)}…` : cleaned;
}

function isExplanationFacts(value: unknown): value is ExplanationFacts {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ExplanationFacts>;
  return (
    typeof v.roomLabel === 'string' &&
    typeof v.startTime === 'number' && Number.isFinite(v.startTime) &&
    typeof v.endTime === 'number' && Number.isFinite(v.endTime) &&
    typeof v.isAvailable === 'boolean' &&
    typeof v.reasonCode === 'string' && REASON_CODES.includes(v.reasonCode as ReasonCode)
  );
}

// Maps the checker's verdict (error message constants) onto a reason code.
export function reasonCodeFromValidation(validation: ValidationResult): ReasonCode {
  if (validation.isValid) return 'OK';
  const error = validation.error ?? '';
  if (error.startsWith(VALIDATION_ERRORS.intervalBounds)) return 'OUTSIDE_DAY_BOUNDS';
  if (error.startsWith(VALIDATION_ERRORS.futureStart)) return 'START_NOT_AFTER_CLOCK';
  if (error.startsWith(VALIDATION_ERRORS.maxDuration)) return 'DURATION_EXCEEDS_MAX';
  if (error.startsWith(VALIDATION_ERRORS.blockedRoom)) return 'ROOM_BLOCKED';
  if (error.startsWith(BOOKING_CONFLICT_PREFIX)) return 'BOOKING_CONFLICT';
  return 'OTHER';
}

function failureText(facts: ExplanationFacts, label: string): string {
  const from = formatTime(facts.startTime);
  const to = formatTime(facts.endTime);
  switch (facts.reasonCode) {
    case 'OUTSIDE_DAY_BOUNDS':
      return `${label} cannot be booked from ${from} to ${to}. The request needs a start before the end, with both times inside the day (00:00 - 24:00).`;
    case 'START_NOT_AFTER_CLOCK':
      return `${label} is not available from ${from} to ${to}. Bookings must start strictly after the current time.`;
    case 'DURATION_EXCEEDS_MAX':
      return `${label} is not available from ${from} to ${to}. The requested duration of ${facts.endTime - facts.startTime} minutes exceeds the 120-minute maximum.`;
    case 'ROOM_BLOCKED':
      return `${label} is not available from ${from} to ${to}. The room is currently blocked from booking.`;
    case 'BOOKING_CONFLICT':
      return `${label} is not available from ${from} to ${to}. An existing booking overlaps this window.`;
    default:
      return `${label} is not available from ${from} to ${to}. The deterministic checker reported this room as unavailable for the requested window.`;
  }
}

export const mockExplanationAdapter: ExplanationAdapter = {
  explain(facts: ExplanationFacts): ExplanationResult {
    if (!isExplanationFacts(facts)) {
      return { ok: false, error: 'Explanation request was malformed.' };
    }
    const label = sanitizeLabel(facts.roomLabel);
    if (label.length === 0) {
      return { ok: false, error: 'Explanation request was malformed.' };
    }
    if (facts.isAvailable !== (facts.reasonCode === 'OK')) {
      return { ok: false, error: 'Explanation facts were inconsistent.' };
    }
    if (facts.isAvailable) {
      return {
        ok: true,
        text: `${label} is available from ${formatTime(facts.startTime)} to ${formatTime(facts.endTime)}. All booking rules passed for this window.`,
      };
    }
    return { ok: true, text: failureText(facts, label) };
  },
};
