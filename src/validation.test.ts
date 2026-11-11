import { describe, it, expect } from 'vitest';
import { Room, Booking, FilterOptions } from './types';
import { INITIAL_ROOMS, DEMO_CURRENT_TIME } from './data';
import { validateBooking, filterRooms } from './validation';

describe('Smart Campus Room Availability - Validation & Filtering Test Suite', () => {
  
  // Test 1: AC1 - Time Interval Bounds & Current Demo Clock Enforcement
  it('AC1: Rejects bookings outside valid minute bounds [0, 1440) or starting at/before demo current time', () => {
    const room: Room = {
      id: 'r1',
      name: 'Test Room',
      capacity: 30,
      equipment: ['Projector'],
      isBlocked: false,
      bookings: []
    };

    // Before current demo time (DEMO_CURRENT_TIME = 540 / 09:00 AM)
    const resPast = validateBooking(room, 480, 540, DEMO_CURRENT_TIME);
    expect(resPast.isValid).toBe(false);
    expect(resPast.error).toContain('Start time must be strictly after the current demo clock.');

    // Invalid negative or 1440+ bounds
    const resBounds = validateBooking(room, -10, 60, DEMO_CURRENT_TIME);
    expect(resBounds.isValid).toBe(false);
    expect(resBounds.error).toContain('Interval bounds must satisfy');
  });

  // Test 2: AC2 - Maximum Duration Ceiling (120 minutes limit)
  it('AC2: Rejects bookings exceeding the maximum duration ceiling of 120 minutes', () => {
    const room: Room = {
      id: 'r1',
      name: 'Test Room',
      capacity: 30,
      equipment: ['Projector'],
      isBlocked: false,
      bookings: []
    };

    // 150 minutes duration (600 to 750)
    const result = validateBooking(room, 600, 750, DEMO_CURRENT_TIME);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Booking duration must not exceed 120 minutes.');

    // Valid 90 minute duration (600 to 690)
    const validResult = validateBooking(room, 600, 690, DEMO_CURRENT_TIME);
    expect(validResult.isValid).toBe(true);
  });

  // Test 3: AC3 - Blocked Room Restriction Guard
  it('AC3: Programmatically restricts blocked rooms from being booked', () => {
    const blockedRoom: Room = {
      id: 'r-blocked',
      name: 'Under Maintenance Lab',
      capacity: 30,
      equipment: ['Projector'],
      isBlocked: true,
      bookings: []
    };

    const result = validateBooking(blockedRoom, 600, 660, DEMO_CURRENT_TIME);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Selected room is programmatically blocked');
  });

  // Test 4: AC4 - Non-Overlapping Intervals & Touching Endpoints Permitted
  it('AC4: Rejects overlapping bookings while explicitly permitting touching endpoints', () => {
    const roomWithBooking: Room = {
      id: 'r1',
      name: 'Active Room',
      capacity: 30,
      equipment: ['Projector'],
      isBlocked: false,
      bookings: [
        { id: 'b1', start: 600, end: 660 } // 10:00 - 11:00 AM
      ]
    };

    // Touching endpoint: ending exactly when existing starts (600) -> Allowed
    const touchingBefore = validateBooking(roomWithBooking, 540, 600, DEMO_CURRENT_TIME);
    expect(touchingBefore.isValid).toBe(true);

    // Touching endpoint: starting exactly when existing ends (660) -> Allowed
    const touchingAfter = validateBooking(roomWithBooking, 660, 720, DEMO_CURRENT_TIME);
    expect(touchingAfter.isValid).toBe(true);

    // Direct overlap -> Rejected
    const overlapResult = validateBooking(roomWithBooking, 630, 690, DEMO_CURRENT_TIME);
    expect(overlapResult.isValid).toBe(false);
    expect(overlapResult.error).toContain('Conflict with existing booking');
  });

  // Test 5: AC5 - Data Immutability Preservation
  it('AC5: Ensures validation functions act as pure checks without mutating room or booking structures', () => {
    const room: Room = {
      id: 'r1',
      name: 'Immutable Room',
      capacity: 30,
      equipment: ['Projector'],
      isBlocked: false,
      bookings: [{ id: 'b1', start: 600, end: 660 }]
    };

    const bookingsSnapshot = JSON.parse(JSON.stringify(room.bookings));
    const roomSnapshot = JSON.parse(JSON.stringify(room));

    validateBooking(room, 700, 760, DEMO_CURRENT_TIME);

    expect(room.bookings).toEqual(bookingsSnapshot);
    expect(room).toEqual(roomSnapshot);
  });

  // Test 6: F1 - Capacity Filtering (capacity >= attendees)
  it('F1: Filters rooms correctly based on attendee capacity requirements', () => {
    const filters: FilterOptions = {
      attendees: 35,
      requiredEquipment: [],
      start: 700,
      end: 760
    };

    const results = filterRooms(INITIAL_ROOMS, filters, DEMO_CURRENT_TIME);
    // Alpha has cap 50, Delta has cap 30. Beta (20) and Gamma (15, blocked) should be excluded.
    expect(results.some(r => r.id === 'room-alpha')).toBe(true);
    expect(results.some(r => r.id === 'room-delta')).toBe(false); // Delta has capacity 30 (< 35)
  });

  // Test 7: F2 - Equipment Matching (ALL required items present)
  it('F2: Filters rooms to ensure they possess ALL user-specified required equipment items', () => {
    const filters: FilterOptions = {
      attendees: 10,
      requiredEquipment: ['Projector', 'Whiteboard'],
      start: 700,
      end: 760
    };

    const results = filterRooms(INITIAL_ROOMS, filters, DEMO_CURRENT_TIME);
    // Rooms must have both Projector and Whiteboard
    results.forEach(r => {
      expect(r.equipment).toContain('Projector');
      expect(r.equipment).toContain('Whiteboard');
    });
    // Beta lacks Projector, Gamma lacks Whiteboard (and is blocked)
    expect(results.some(r => r.id === 'room-beta')).toBe(false);
  });

  // Test 8: F3 - Blocked Room Status Guard in Search Filters
  it('F3: Excludes blocked rooms from search results regardless of capacity and equipment match', () => {
    const filters: FilterOptions = {
      attendees: 5, // Gamma has capacity 15, matching equipment (Computers, Projector)
      requiredEquipment: ['Computers'],
      start: 700,
      end: 760
    };

    const results = filterRooms(INITIAL_ROOMS, filters, DEMO_CURRENT_TIME);
    // Gamma is blocked (isBlocked: true), so it must never appear in available results
    expect(results.some(r => r.id === 'room-gamma')).toBe(false);
  });

  // Test 9: F4 - Empty State Handling (No matching rooms)
  it('F4: Returns an empty array when filter criteria match zero rooms, triggering UI empty state', () => {
    const filters: FilterOptions = {
      attendees: 500, // Impossibly high capacity
      requiredEquipment: ['Quantum Processor'], // Non-existent equipment
      start: 700,
      end: 760
    };

    const results = filterRooms(INITIAL_ROOMS, filters, DEMO_CURRENT_TIME);
    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });

  // Test 10: F5 - Room Switching State Synchronization & Unique Bookings Check
  it('F5: Validates that independent room booking states are correctly evaluated upon room selection switch', () => {
    const roomA: Room = {
      id: 'a',
      name: 'Room A',
      capacity: 40,
      equipment: [],
      isBlocked: false,
      bookings: [{ id: '1', start: 600, end: 700 }]
    };

    const roomB: Room = {
      id: 'b',
      name: 'Room B',
      capacity: 40,
      equipment: [],
      isBlocked: false,
      bookings: [] // Completely free
    };

    const candidateStart = 630;
    const candidateEnd = 690;

    // Room A has a conflict during this window
    const validationA = validateBooking(roomA, candidateStart, candidateEnd, DEMO_CURRENT_TIME);
    expect(validationA.isValid).toBe(false);

    // Room B is free during this window
    const validationB = validateBooking(roomB, candidateStart, candidateEnd, DEMO_CURRENT_TIME);
    expect(validationB.isValid).toBe(true);
  });

});