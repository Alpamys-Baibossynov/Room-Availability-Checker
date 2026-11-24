import { describe, it, expect } from 'vitest';
import { mockExplanationAdapter, ExplanationInput } from './explanation';
import { validateBooking, VALIDATION_ERRORS, BOOKING_CONFLICT_PREFIX } from './validation';
import { Room, ValidationResult } from './types';
import { DEMO_CURRENT_TIME } from './data';

const freeRoom: Room = {
  id: 'r-exp',
  name: 'Explanation Room',
  capacity: 30,
  equipment: ['Projector'],
  isBlocked: false,
  bookings: [{ id: 'b1', start: 600, end: 660 }],
};

function baseInput(validation: ValidationResult, start = 700, end = 760): ExplanationInput {
  return {
    roomName: freeRoom.name,
    start,
    end,
    currentTime: DEMO_CURRENT_TIME,
    validation,
  };
}

describe('Mock explanation adapter', () => {
  it('explains an available verdict without deciding availability itself', () => {
    const verdict = validateBooking(freeRoom, 700, 760, DEMO_CURRENT_TIME);
    expect(verdict.isValid).toBe(true);
    const res = mockExplanationAdapter.explain(baseInput(verdict));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.text).toContain('Explanation Room is available');
      expect(res.text).toContain('11:40');
      expect(res.text).toContain('12:40');
    }
  });

  it('explains each rule failure using the checker verdict message', () => {
    const cases: Array<{ input: Parameters<typeof validateBooking>[1]; end: number; expected: string; keyword: string }> = [
      { input: 700, end: 640, expected: VALIDATION_ERRORS.intervalBounds, keyword: 'start before the end' },
      { input: 540, end: 600, expected: VALIDATION_ERRORS.futureStart, keyword: 'demo clock' },
      { input: 600, end: 721, expected: VALIDATION_ERRORS.maxDuration, keyword: '121 minutes' },
    ];

    for (const c of cases) {
      const verdict = validateBooking(freeRoom, c.input, c.end, DEMO_CURRENT_TIME);
      expect(verdict.isValid).toBe(false);
      const res = mockExplanationAdapter.explain(baseInput(verdict, c.input, c.end));
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.text).toContain('Explanation Room');
        expect(res.text).toContain(c.keyword);
      }
    }

    const overlap = validateBooking(freeRoom, 630, 690, DEMO_CURRENT_TIME);
    expect(overlap.isValid).toBe(false);
    expect(overlap.error).toContain(BOOKING_CONFLICT_PREFIX);
    const overlapRes = mockExplanationAdapter.explain(baseInput(overlap, 630, 690));
    if (overlapRes.ok) expect(overlapRes.text).toContain('10:00 - 11:00');

    const blockedRoom: Room = { ...freeRoom, isBlocked: true };
    const blockedVerdict = validateBooking(blockedRoom, 700, 760, DEMO_CURRENT_TIME);
    const blockedRes = mockExplanationAdapter.explain(baseInput(blockedVerdict));
    if (blockedRes.ok) expect(blockedRes.text).toContain('blocked');
  });

  it('rejects malformed input gracefully instead of throwing', () => {
    const bad = [
      null,
      {},
      { ...baseInput({ isValid: true }), roomName: '' },
      { ...baseInput({ isValid: true }), start: '600' },
    ];
    for (const b of bad) {
      const res = mockExplanationAdapter.explain(b as unknown as ExplanationInput);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toContain('malformed');
    }
  });

  it('never mutates the input or the underlying room data', () => {
    const roomSnapshot = JSON.parse(JSON.stringify(freeRoom));
    const verdict = validateBooking(freeRoom, 700, 760, DEMO_CURRENT_TIME);
    const input = baseInput(verdict);
    const inputSnapshot = JSON.parse(JSON.stringify(input));
    mockExplanationAdapter.explain(input);
    expect(input).toEqual(inputSnapshot);
    expect(freeRoom).toEqual(roomSnapshot);
  });
});
