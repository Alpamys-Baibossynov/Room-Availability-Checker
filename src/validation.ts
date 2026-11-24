import { Room, ValidationResult, FilterOptions } from './types';

// Canonical rule failure messages, exported so other modules (e.g. the
// explanation adapter) can key off verdicts without duplicating strings.
export const VALIDATION_ERRORS = {
  intervalBounds: 'Interval bounds must satisfy 0 <= start < end <= 1440.',
  futureStart: 'Start time must be strictly after the current demo clock.',
  maxDuration: 'Booking duration must not exceed 120 minutes.',
  blockedRoom: 'Selected room is programmatically blocked from booking.',
} as const;

export const BOOKING_CONFLICT_PREFIX = 'Conflict with existing booking';

interface ValidationContext {
  room: Room;
  candidateStart: number;
  candidateEnd: number;
  currentTime: number;
}

// A pure rule returns a failure result, or null when the check passes.
type ValidationRule = (ctx: ValidationContext) => ValidationResult | null;

// AC1 (bounds): 0 <= start < end <= 1440
const intervalBoundsRule: ValidationRule = ({ candidateStart, candidateEnd }) => {
  if (candidateStart < 0 || candidateEnd > 1440 || candidateStart >= candidateEnd) {
    return { isValid: false, error: VALIDATION_ERRORS.intervalBounds };
  }
  return null;
};

// AC1 (clock): start must be strictly after the current demo time
const futureStartRule: ValidationRule = ({ candidateStart, currentTime }) => {
  if (candidateStart <= currentTime) {
    return { isValid: false, error: VALIDATION_ERRORS.futureStart };
  }
  return null;
};

// AC2: maximum booking duration of 120 minutes
const maxDurationRule: ValidationRule = ({ candidateStart, candidateEnd }) => {
  if (candidateEnd - candidateStart > 120) {
    return { isValid: false, error: VALIDATION_ERRORS.maxDuration };
  }
  return null;
};

// AC3: blocked rooms can never be booked
const blockedRoomRule: ValidationRule = ({ room }) => {
  if (room.isBlocked) {
    return { isValid: false, error: VALIDATION_ERRORS.blockedRoom };
  }
  return null;
};

// AC4: overlap requires candidateStart < b.end AND candidateEnd > b.start;
// bookings that only touch at endpoints do not conflict.
const bookingConflictRule: ValidationRule = ({ room, candidateStart, candidateEnd }) => {
  for (const b of room.bookings) {
    if (candidateStart < b.end && candidateEnd > b.start) {
      return {
        isValid: false,
        error: `${BOOKING_CONFLICT_PREFIX} (${formatTime(b.start)} - ${formatTime(b.end)}).`,
      };
    }
  }
  return null;
};

const BOOKING_RULES: ValidationRule[] = [
  intervalBoundsRule,
  futureStartRule,
  maxDurationRule,
  blockedRoomRule,
  bookingConflictRule,
];

export function validateBooking(
  room: Room,
  candidateStart: number,
  candidateEnd: number,
  currentTime: number
): ValidationResult {
  const ctx: ValidationContext = { room, candidateStart, candidateEnd, currentTime };
  for (const rule of BOOKING_RULES) {
    const failure = rule(ctx);
    if (failure) return failure;
  }
  return { isValid: true };
}

export function filterRooms(
  rooms: Room[],
  filters: FilterOptions,
  currentTime: number
): Room[] {
  return rooms.filter(room => {
    if (room.capacity < filters.attendees) return false;
    const hasAllEquipment = filters.requiredEquipment.every(reqEq =>
      room.equipment.includes(reqEq)
    );
    if (!hasAllEquipment) return false;

    return validateBooking(room, filters.start, filters.end, currentTime).isValid;
  });
}

// R1: keeps the selection only if it is still visible in the filtered list,
// otherwise falls back to the first match (or empty when nothing matches).
export function reconcileSelectedRoomId(
  selectedRoomId: string,
  matchingRoomIds: string[]
): string {
  return matchingRoomIds.includes(selectedRoomId) ? selectedRoomId : matchingRoomIds[0] ?? '';
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}`;
}
