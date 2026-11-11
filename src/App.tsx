import { useState } from 'react';
import { RoomChecker } from './RoomChecker';
import { INITIAL_ROOMS, DEMO_CURRENT_TIME } from './data';
import type { Room } from './types';

function App() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);

  const handleBookRoom = (roomId: string, start: number, end: number) => {
    setRooms(prev =>
      prev.map(r =>
        r.id === roomId
          ? { ...r, bookings: [...r.bookings, { id: `b-${Date.now()}`, start, end }] }
          : r
      )
    );
  };

  return (
    <RoomChecker
      rooms={rooms}
      currentTime={DEMO_CURRENT_TIME}
      onBookRoom={handleBookRoom}
    />
  );
}

export default App;
