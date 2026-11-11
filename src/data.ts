import { Room } from './types';

export const DEMO_CURRENT_TIME = 540; // 09:00 AM in minutes from midnight

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-alpha',
    name: 'Alpha Lecture Hall',
    capacity: 50,
    equipment: ['Projector', 'Whiteboard', 'Microphone'],
    isBlocked: false,
    bookings: [
      { id: 'b1', start: 600, end: 660 }, // 10:00 - 11:00 AM
    ],
  },
  {
    id: 'room-beta',
    name: 'Beta Seminar Room',
    capacity: 20,
    equipment: ['Whiteboard', 'TV Screen'],
    isBlocked: false,
    bookings: [
      { id: 'b2', start: 600, end: 720 },  // 10:00 - 12:00 PM
    ],
  },
  {
    id: 'room-gamma',
    name: 'Gamma Computer Lab',
    capacity: 15,
    equipment: ['Computers', 'Projector'],
    isBlocked: true, // F3: Blocked room guard
    bookings: [],
  },
  {
    id: 'room-delta',
    name: 'Delta Conference Hub',
    capacity: 30,
    equipment: ['Projector', 'Whiteboard', 'Video Conference'],
    isBlocked: false,
    bookings: [],
  },
];