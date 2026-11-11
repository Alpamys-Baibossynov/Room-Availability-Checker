import { Room, ValidationResult, FilterOptions } from './types';

/**
 * Validates a candidate booking against a room's specific bookings and core constraints (F1-F3).
 * Implemented as a pure function without data mutation.
 */
export function validateBooking(
  room: Room,
  candidateStart: number,
  candidateEnd: number,
  currentTime: number
): ValidationResult {
  // Interval boundary validation & demo clock check
  if (candidateStart < 0 || candidateEnd > 1440 || candidateStart >= candidateEnd) {
    return { isValid: false, error: 'Interval bounds must satisfy 0 <= start < end <= 1440.' };
  }
  if (candidateStart <= currentTime) {
    return { isValid: false, error: 'Start time must be strictly after the current demo clock.' };
  }

  // Maximum duration ceiling (120 minutes)
  if (candidateEnd - candidateStart > 120) {
    return { isValid: false, error: 'Booking duration must not exceed 120 minutes.' };
  }

  // F3: Blocked status restriction
  if (room.isBlocked) {
    return { isValid: false, error: 'Selected room is programmatically blocked from booking.' };
  }

  // Overlap evaluation against the room's unique bookings array (touching endpoints permitted)
  for (const b of room.bookings) {
    const hasOverlap = !(candidateEnd <= b.start || candidateStart >= b.end);
    if (hasOverlap) {
      return { 
        isValid: false, 
        error: `Conflict with existing booking (${formatTime(b.start)} - ${formatTime(b.end)}).` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Filters the room catalog based on capacity (F1), equipment (F2), and blocked status (F3).
 */
export function filterRooms(
  rooms: Room[],
  filters: FilterOptions,
  currentTime: number
): Room[] {
  return rooms.filter(room => {
    // F3: Exclude blocked rooms from availability results
    if (room.isBlocked) return false;

    // F1: Capacity filter (capacity >= requested attendees)
    if (room.capacity < filters.attendees) return false;

    // F2: Equipment filter (room must possess ALL user-required equipment)
    const hasAllEquipment = filters.requiredEquipment.every(reqEq =>
      room.equipment.includes(reqEq)
    );
    if (!hasAllEquipment) return false;

    // Evaluate interval availability using room's unique bookings
    const validation = validateBooking(room, filters.start, filters.end, currentTime);
    return validation.isValid;
  });
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}`;
}