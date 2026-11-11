import { describe, test, expect } from 'vitest';
import { validateBooking, filterRooms, formatTime } from './validation';
import type { Room } from './types';

const baseRoom: Room = {
  id: 'room-1',
  name: 'Alpha Room',
  capacity: 10,
  equipment: ['Projector', 'Whiteboard'],
  isBlocked: false,
  bookings: [{ id: 'b1', start: 600, end: 660 }], // 10:00 - 11:00 AM
};

const NOW = 540; // 09:00

describe('validateBooking (AC1-AC4)', () => {
  test('touching after existing booking is allowed', () => {
    const room = { ...baseRoom, bookings: [...baseRoom.bookings] };
    expect(validateBooking(room, 660, 720, NOW).isValid).toBe(true);
  });

  test('touching before existing booking is allowed', () => {
    const room = { ...baseRoom, bookings: [...baseRoom.bookings] };
    expect(validateBooking(room, 570, 600, NOW).isValid).toBe(true);
  });

  test('booking starting at current time is rejected', () => {
    expect(validateBooking(baseRoom, 540, 570, NOW).isValid).toBe(false);
  });

  test('zero duration booking is rejected', () => {
    expect(validateBooking(baseRoom, 720, 720, NOW).isValid).toBe(false);
  });

  test('reversed interval is rejected', () => {
    expect(validateBooking(baseRoom, 750, 720, NOW).isValid).toBe(false);
  });

  test('interval exceeding day boundary is rejected', () => {
    expect(validateBooking(baseRoom, 1380, 1441, NOW).isValid).toBe(false);
  });

  test('negative start time is rejected', () => {
    expect(validateBooking(baseRoom, -10, 60, NOW).isValid).toBe(false);
  });

  test('exactly 120 minutes is allowed', () => {
    expect(validateBooking(baseRoom, 720, 840, NOW).isValid).toBe(true);
  });

  test('duration longer than 120 minutes is rejected', () => {
    const res = validateBooking(baseRoom, 720, 841, NOW);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('120 minutes');
  });

  test('partial overlap is rejected', () => {
    expect(validateBooking(baseRoom, 630, 690, NOW).isValid).toBe(false);
  });

  test('interval containing an existing booking is rejected', () => {
    expect(validateBooking(baseRoom, 570, 690, NOW).isValid).toBe(false);
  });

  test('interval inside an existing booking is rejected', () => {
    expect(validateBooking(baseRoom, 615, 645, NOW).isValid).toBe(false);
  });

  test('identical interval is rejected', () => {
    expect(validateBooking(baseRoom, 600, 660, NOW).isValid).toBe(false);
  });

  test('blocked room is rejected with feedback', () => {
    const res = validateBooking({ ...baseRoom, isBlocked: true }, 660, 720, NOW);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('blocked');
  });

  test('empty bookings list is allowed', () => {
    expect(validateBooking({ ...baseRoom, bookings: [] }, 660, 720, NOW).isValid).toBe(true);
  });

  test('conflict with a second booking is rejected', () => {
    const room: Room = {
      ...baseRoom,
      bookings: [
        { id: 'b1', start: 600, end: 660 },
        { id: 'b2', start: 700, end: 760 },
      ],
    };
    expect(validateBooking(room, 720, 780, NOW).isValid).toBe(false);
  });

  test('validateBooking does not mutate room.bookings', () => {
    const room = { ...baseRoom, bookings: [{ id: 'b1', start: 600, end: 660 }] };
    const snapshot = JSON.stringify(room.bookings);
    validateBooking(room, 660, 720, NOW);
    expect(JSON.stringify(room.bookings)).toBe(snapshot);
  });
});

describe('filterRooms (F1-F3)', () => {
  test('excludes blocked rooms', () => {
    const rooms = [baseRoom, { ...baseRoom, id: 'room-2', isBlocked: true }];
    const filters = { attendees: 5, requiredEquipment: [], start: 660, end: 720 };
    expect(filterRooms(rooms, filters, NOW)).toHaveLength(1);
    expect(filterRooms(rooms, filters, NOW)[0].id).toBe('room-1');
  });

  test('filters by capacity', () => {
    const rooms = [baseRoom, { ...baseRoom, id: 'room-2', capacity: 2 }];
    const filters = { attendees: 5, requiredEquipment: [], start: 660, end: 720 };
    expect(filterRooms(rooms, filters, NOW)).toHaveLength(1);
  });

  test('filters by required equipment', () => {
    const rooms = [baseRoom, { ...baseRoom, id: 'room-2', equipment: ['Whiteboard'] }];
    const filters = { attendees: 5, requiredEquipment: ['Projector'], start: 660, end: 720 };
    expect(filterRooms(rooms, filters, NOW)).toHaveLength(1);
    expect(filterRooms(rooms, filters, NOW)[0].id).toBe('room-1');
  });

  test('excludes rooms with a conflicting booking', () => {
    const rooms = [baseRoom];
    const filters = { attendees: 1, requiredEquipment: [], start: 600, end: 660 };
    expect(filterRooms(rooms, filters, NOW)).toHaveLength(0);
  });
});

describe('formatTime', () => {
  test('formats minutes since midnight as HH:MM', () => {
    expect(formatTime(540)).toBe('09:00');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(720)).toBe('12:00');
  });
});
