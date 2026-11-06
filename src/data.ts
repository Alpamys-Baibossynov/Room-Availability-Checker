import type { Room, Booking } from './types';

export const ROOMS: Room[] = [
  { id: 'r1', name: 'Whitfield 101',  building: 'Whitfield Hall',  capacity: 40, blocked: false, imageQuery: 'university lecture hall' },
  { id: 'r2', name: 'Marston 204',    building: 'Marston Hall',    capacity: 25, blocked: false, imageQuery: 'modern classroom' },
  { id: 'r3', name: 'Keller 310',     building: 'Keller Center',   capacity: 15, blocked: true,  imageQuery: 'computer lab' },
  { id: 'r4', name: 'Alden Auditorium', building: 'Alden Hall',     capacity: 120, blocked: false, imageQuery: 'auditorium stage' },
  { id: 'r5', name: 'Bell Study B',   building: 'Bell Library',     capacity: 8,  blocked: false, imageQuery: 'library study room' },
];

// Current time in minutes from midnight — fictional campus clock for demo
export const DEMO_CURRENT_MINUTES = 540; // 9:00 AM

export const SAMPLE_BOOKINGS: Booking[] = [
  { id: 'b1', roomId: 'r1', start: 540,  end: 600,  bookedBy: 'Prof. Haley' },
  { id: 'b2', roomId: 'r1', start: 720,  end: 780,  bookedBy: 'CS Study Group' },
  { id: 'b3', roomId: 'r2', start: 600,  end: 660,  bookedBy: 'Tutoring Center' },
  { id: 'b4', roomId: 'r2', start: 840,  end: 900,  bookedBy: 'Robotics Club' },
  { id: 'b5', roomId: 'r4', start: 480,  end: 540,  bookedBy: 'Open House' },
  { id: 'b6', roomId: 'r5', start: 660,  end: 720,  bookedBy: 'Writing Workshop' },
];
