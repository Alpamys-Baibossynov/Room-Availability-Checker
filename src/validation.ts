import { Room, ValidationResult, FilterOptions } from './types';

export function validateBooking(
  room: Room,
  candidateStart: number,
  candidateEnd: number,
  currentTime: number
): ValidationResult {
  if (candidateStart < 0 || candidateEnd > 1440 || candidateStart >= candidateEnd) {
    return { isValid: false, error: 'Interval bounds must satisfy 0 <= start < end <= 1440.' };
  }
  
  // Strict check: candidate start must be after current time
  if (candidateStart <= currentTime) {
    return { isValid: false, error: 'Start time must be strictly after the current demo clock.' };
  }

  if (candidateEnd - candidateStart > 120) {
    return { isValid: false, error: 'Booking duration must not exceed 120 minutes.' };
  }

  if (room.isBlocked) {
    return { isValid: false, error: 'Selected room is programmatically blocked from booking.' };
  }

  // AC4: Two intervals overlap if and only if candidateStart < b.end AND candidateEnd > b.start.
  // Touching endpoints (e.g., candidateEnd === b.start) do NOT overlap.
  for (const b of room.bookings) {
    const hasOverlap = candidateStart < b.end && candidateEnd > b.start;
    if (hasOverlap) {
      return { 
        isValid: false, 
        error: `Conflict with existing booking (${formatTime(b.start)} - ${formatTime(b.end)}).` 
      };
    }
  }

  return { isValid: true };
}

export function filterRooms(
  rooms: Room[],
  filters: FilterOptions,
  currentTime: number
): Room[] {
  return rooms.filter(room => {
    if (room.isBlocked) return false;
    if (room.capacity < filters.attendees) return false;
    const hasAllEquipment = filters.requiredEquipment.every(reqEq =>
      room.equipment.includes(reqEq)
    );
    if (!hasAllEquipment) return false;

    const validation = validateBooking(room, filters.start, filters.end, currentTime);
    return validation.isValid;
  });
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}`;
}