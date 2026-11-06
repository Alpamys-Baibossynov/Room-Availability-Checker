import { describe, test, expect } from 'vitest';
import { checkAvailability } from './validation';
import type { Room, Booking } from './types';

const defaultRoom: Room = {
  id: 'room-1',
  name: 'Alpha Room',
  building: 'Building A',
  capacity: 10,
  blocked: false,
};

const defaultBookings: Booking[] = [
  { id: 'b1', roomId: 'room-1', bookedBy: 'Alice', start: 600, end: 660 },
];

const DEFAULT_NOW = 540; // 09:00

describe('Smart Campus Room Availability Tests (AC1–AC6)', () => {
  
  // T01 / AC4: Touching after is allowed
  test('T01: touching after is available', () => {
    const bookingsCopy = JSON.parse(JSON.stringify(defaultBookings));
    const result = checkAvailability(defaultRoom, 660, 720, DEFAULT_NOW, bookingsCopy);
    expect(result.ok).toBe(true);
    expect(bookingsCopy).toEqual(defaultBookings); // AC5: data-preservation check
  });

  // T02 / AC1: Starts now or earlier is rejected
  test('T02: booking starting at current time is rejected', () => {
    const result = checkAvailability(defaultRoom, 540, 570, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T03 / AC1: Zero duration is rejected
  test('T03: zero duration booking is rejected', () => {
    const result = checkAvailability(defaultRoom, 720, 720, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T04 / AC1: Reversed interval is rejected
  test('T04: reversed interval is rejected', () => {
    const result = checkAvailability(defaultRoom, 750, 720, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T05 / AC1: Past day end (> 1440) is rejected
  test('T05: interval exceeding day boundary is rejected', () => {
    const result = checkAvailability(defaultRoom, 1380, 1441, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T06 / AC2: Exactly 120 minutes is allowed
  test('T06: exactly 120 minutes duration is allowed', () => {
    const result = checkAvailability(defaultRoom, 720, 840, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(true);
  });

  // T07 / AC2 & AC6: 121 minutes duration is rejected with feedback
  test('T07: duration longer than 120 minutes is rejected', () => {
    const result = checkAvailability(defaultRoom, 720, 841, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('cannot be longer than 120 minutes');
    }
  });

  // T08 / AC4: Touching before is allowed
  test('T08: touching before existing booking is allowed', () => {
    const result = checkAvailability(defaultRoom, 570, 600, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(true);
  });

  // T09 / AC4: Partial overlap is rejected
  test('T09: partial overlap with existing booking is rejected', () => {
    const result = checkAvailability(defaultRoom, 630, 690, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T10 / AC4: Contains existing booking is rejected
  test('T10: interval containing an existing booking is rejected', () => {
    const result = checkAvailability(defaultRoom, 570, 690, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T11 / AC4: Completely inside existing booking is rejected
  test('T11: interval completely inside an existing booking is rejected', () => {
    const result = checkAvailability(defaultRoom, 615, 645, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T12 / AC4: Identical interval is rejected
  test('T12: identical interval to existing booking is rejected', () => {
    const result = checkAvailability(defaultRoom, 600, 660, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T13 / AC3 & AC6: Blocked room is rejected with feedback
  test('T13: blocked room is rejected', () => {
    const blockedRoom: Room = { ...defaultRoom, blocked: true };
    const result = checkAvailability(blockedRoom, 660, 720, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('currently blocked');
    }
  });

  // T14 / AC4: Empty booking list is allowed
  test('T14: booking request with empty bookings list is allowed', () => {
    const result = checkAvailability(defaultRoom, 660, 720, DEFAULT_NOW, []);
    expect(result.ok).toBe(true);
  });

  // T15 (Custom 1) / AC1: Negative start time is rejected
  test('T15: negative start time is rejected', () => {
    const result = checkAvailability(defaultRoom, -10, 60, DEFAULT_NOW, defaultBookings);
    expect(result.ok).toBe(false);
  });

  // T16 (Custom 2) / AC4: Conflict with a secondary booking in the list is rejected
  test('T16: conflict with second booking in list is rejected', () => {
    const multipleBookings: Booking[] = [
      { id: 'b1', roomId: 'room-1', bookedBy: 'Alice', start: 600, end: 660 },
      { id: 'b2', roomId: 'room-1', bookedBy: 'Bob', start: 700, end: 760 },
    ];
    const result = checkAvailability(defaultRoom, 720, 780, DEFAULT_NOW, multipleBookings);
    expect(result.ok).toBe(false);
  });

  // T17 (AC5 Data-preservation test)
  test('T17: existing bookings data is preserved unchanged after check', () => {
    const bookingsSnapshot = JSON.stringify(defaultBookings);
    checkAvailability(defaultRoom, 660, 720, DEFAULT_NOW, defaultBookings);
    expect(JSON.stringify(defaultBookings)).toBe(bookingsSnapshot);
  });

});