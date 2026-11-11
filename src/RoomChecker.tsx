import React, { useState, useEffect } from 'react';
import { Room, FilterOptions } from './types';
import { filterRooms, validateBooking, formatTime } from './validation';

interface RoomCheckerProps {
  rooms: Room[];
  currentTime: number;
  onBookRoom: (roomId: string, start: number, end: number) => void;
}

export const RoomChecker: React.FC<RoomCheckerProps> = ({
  rooms,
  currentTime,
  onBookRoom,
}) => {
  // Filter States
  const [attendees, setAttendees] = useState<number>(10);
  const [selectedEquip, setSelectedEquip] = useState<string[]>([]);
  const [startMin, setStartMin] = useState<number>(600); // 10:00 AM default
  const [endMin, setEndMin] = useState<number>(660);     // 11:00 AM default

  // F5: Room switching and instant reactive availability refresh
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeValidation, setActiveValidation] = useState<{ isValid: boolean; error?: string } | null>(null);

  const availableEquipmentList = ['Projector', 'Whiteboard', 'Microphone', 'TV Screen', 'Computers', 'Video Conference'];

  const filters: FilterOptions = {
    attendees,
    requiredEquipment: selectedEquip,
    start: startMin,
    end: endMin,
  };

  // Compute matching rooms dynamically (F1, F2, F3)
  const matchingRooms = filterRooms(rooms, filters, currentTime);

  // F5: Dynamic availability re-check when switching rooms or adjusting filter parameters
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => {
      const currentRoom = rooms.find(r => r.id === selectedRoomId);
      if (currentRoom) {
        const res = validateBooking(currentRoom, startMin, endMin, currentTime);
        setActiveValidation(res);
      }
      setIsRefreshing(false);
    }, 150); // simulated async refresh lag

    return () => clearTimeout(timer);
  }, [selectedRoomId, startMin, endMin, attendees, selectedEquip, rooms, currentTime]);

  const toggleEquipment = (eq: string) => {
    setSelectedEquip(prev =>
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const handleBookingConfirm = () => {
    if (activeValidation?.isValid) {
      onBookRoom(selectedRoomId, startMin, endMin);
      alert('Room successfully booked!');
    }
  };

  return (
    <div className="room-checker-container p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sidebar Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 md:col-span-1">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Filter Criteria</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attendees: {attendees}</label>
          <input
            type="number"
            min="1"
            max="100"
            value={attendees}
            onChange={e => setAttendees(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Window (Minutes)</label>
          <div className="flex gap-2">
            <div>
              <span className="text-xs text-gray-500">Start ({formatTime(startMin)})</span>
              <input
                type="number"
                step="30"
                value={startMin}
                onChange={e => setStartMin(parseInt(e.target.value) || 0)}
                className="w-full border rounded p-1 text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500">End ({formatTime(endMin)})</span>
              <input
                type="number"
                step="30"
                value={endMin}
                onChange={e => setEndMin(parseInt(e.target.value) || 0)}
                className="w-full border rounded p-1 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Required Equipment</label>
          <div className="space-y-1">
            {availableEquipmentList.map(eq => (
              <label key={eq} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={selectedEquip.includes(eq)}
                  onChange={() => toggleEquipment(eq)}
                  className="mr-2"
                />
                {eq}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Catalog & Room Status Section */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Room Catalog</h2>
          
          {/* F4: Explicit Empty State */}
          {matchingRooms.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-gray-600 font-medium">No rooms match your filter criteria.</p>
              <p className="text-xs text-gray-400 mt-1">Try relaxing attendee limits, equipment requirements, or adjusting time windows.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchingRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    selectedRoomId === room.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Cap: {room.capacity}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.equipment.map(eq => (
                      <span key={eq} className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* F5: Selected Room Live Status & Async Refresh Panel */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-md font-bold text-gray-800 mb-2">Selected Room Status</h3>
          {isRefreshing ? (
            <div className="text-sm text-blue-600 animate-pulse">Refreshing availability status...</div>
          ) : (
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Active Selection: <span className="font-semibold">{rooms.find(r => r.id === selectedRoomId)?.name || 'None'}</span>
              </p>
              {activeValidation?.isValid ? (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm flex justify-between items-center">
                  <span>Room is available for booking during {formatTime(startMin)} - {formatTime(endMin)}.</span>
                  <button
                    onClick={handleBookingConfirm}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700"
                  >
                    Confirm Booking
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  <span>Unavailable: {activeValidation?.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};