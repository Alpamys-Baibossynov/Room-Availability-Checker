import { Room } from './types';

export const DEMO_CURRENT_TIME = 540; // 09:00 AM in minutes from midnight

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-alpha',
    name: 'Alpha Lecture Hall',
    capacity: 50,
    equipment: ['Projector', 'Whiteboard', 'Microphone'],
    isBlocked: false,
    bookings: [{ id: 'b1', start: 600, end: 660 }], // 10:00 - 11:00 AM
  },
];
