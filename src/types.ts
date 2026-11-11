export interface Booking {
  id: string;
  start: number; // Minutes after midnight (0 <= start < 1440)
  end: number;   // Minutes after midnight (0 <= end <= 1440)
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  isBlocked: boolean;
  bookings: Booking[]; // Unique per-room booking catalog
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FilterOptions {
  attendees: number;
  requiredEquipment: string[];
  start: number;
  end: number;
}