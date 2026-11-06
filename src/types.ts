export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  blocked: boolean;
  imageQuery: string;
}

export interface Booking {
  id: string;
  roomId: string;
  start: number; // minutes from midnight (0–1440)
  end: number;   // minutes from midnight (0–1440)
  bookedBy: string;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };
