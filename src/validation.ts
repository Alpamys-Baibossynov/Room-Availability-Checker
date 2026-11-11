import { Room, ValidationResult, FilterOptions } from './types';

/**
 * AC1-AC5: Core pure validation logic.
 * Enforces time interval bounds, demo clock constraints, 120-minute ceilings,
 * blocked guards, and overlapping interval checks (touching endpoints permitted).
 */
export function validateBooking(
  room: Room,
  candidateStart: number,
  candidateEnd: number,
  currentTime: number
): ValidationResult {
  // AC1: Interval range & demo clock boundary validation
  if (candidateStart < 0 || candidateEnd > 1440 || candidateStart >= candidateEnd) {
    return { isValid: false, error: 'Interval bounds must satisfy 0 <= start < end <= 1440.' };
  }
  if (candidateStart <= currentTime) {
    return { isValid: false, error: 'Start time must be strictly after the current demo clock.' };
  }

  // AC2: Maximum duration ceiling (120 minutes)
  if (candidateEnd - candidateStart > 120) {
    return { isValid: false, error: 'Booking duration must not exceed 120 minutes.' };
  }

  // AC3 & F3: Blocked room restriction guard
  if (room.isBlocked) {
    return { isValid: false, error: 'Selected room is programmatically blocked from booking.' };
  }

  // AC4: Overlap evaluation with touching endpoints explicitly permitted
  for (const b of room.bookings) {
    const hasOverlap = !(candidateEnd <= b.start || candidateStart >= b.end);
    if (hasOverlap) {
      return { 
        isValid: false, 
        error: `Conflict detected with existing booking (${formatTime(b.start)} - ${formatTime(b.end)}).` 
      };
    }
  }

  return { isValid: true };
}

/**
 * F1-F3: Filters the room catalog based on capacity, equipment, and blocked status.
 */
export function filterRooms(
  rooms: Room[],
  filters: FilterOptions,
  currentTime: number
): Room[] {
  return rooms.filter(room => {
    // F3: Exclude blocked rooms from search results
    if (room.isBlocked) return false;

    // F1: Capacity filter (capacity >= requested attendees)
    if (room.capacity < filters.attendees) return false;

    // F2: Equipment filter (room must possess ALL user-specified required equipment)
    const hasAllEquipment = filters.requiredEquipment.every(reqEq =>
      room.equipment.includes(reqEq)
    );
    if (!hasAllEquipment) return false;

    // Interval availability check against room's unique bookings
    const validation = validateBooking(room, filters.start, filters.end, currentTime);
    return validation.isValid;
  });
}

/**
 * Utility helper to format minutes after midnight to HH:MM string.
 */
export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}`;
}