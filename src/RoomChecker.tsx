import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Building2,
  Lock,
  CalendarCheck,
  Info,
} from 'lucide-react';
import type { Room, Booking, ValidationResult } from './types';
import { ROOMS, SAMPLE_BOOKINGS, DEMO_CURRENT_MINUTES } from './data';
import {
  checkAvailability,
  minutesToLabel,
  timeInputToMinutes,
} from './validation';

export default function RoomChecker() {
  const [bookings] = useState<Booking[]>(SAMPLE_BOOKINGS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const currentRoom = useMemo(
    () => ROOMS.find((r) => r.id === selectedRoomId) ?? ROOMS[0],
    [selectedRoomId],
  );

  const roomBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.roomId === selectedRoomId)
        .sort((a, b) => a.start - b.start),
    [bookings, selectedRoomId],
  );

  function handleCheck() {
    const start = timeInputToMinutes(startTime);
    const end = timeInputToMinutes(endTime);
    const outcome = checkAvailability(currentRoom, start, end, DEMO_CURRENT_MINUTES, bookings);
    setResult(outcome);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Smart Campus Room Availability Checker
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Check if a campus room is free for your requested time slot.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Current campus clock */}
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-teal-50 border border-teal-100 rounded-lg px-4 py-3">
          <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed break-words">
            Campus current time: <strong className="text-teal-700">{minutesToLabel(DEMO_CURRENT_MINUTES)}</strong> (demo clock — all bookings must start after this time)
          </span>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form panel */}
          <section className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Request a room</h2>

              {/* Room selection */}
              <label className="block text-sm font-medium text-slate-700 mb-2">Select a room</label>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {ROOMS.map((room) => {
                  const active = room.id === selectedRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setResult(null);
                      }}
                      className={[
                        'text-left rounded-lg border p-3 transition-all',
                        active
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 break-words">{room.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {room.building}
                          </p>
                        </div>
                        {room.blocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                            <Lock className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            <Users className="w-3 h-3" /> {room.capacity}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 mb-2">
                    Start time
                  </label>
                  <input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setResult(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-2">
                    End time
                  </label>
                  <input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setResult(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCheck}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
              >
                Check Availability
              </button>
            </div>
          </section>

          {/* Result + room details panel */}
          <section className="lg:col-span-2 space-y-4">
            {/* Result */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Result</h2>
              {result === null ? (
                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="break-words">Select a room, enter your times, and click Check Availability.</span>
                </div>
              ) : result.ok ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-700">Available</p>
                    <p className="text-sm text-slate-600 mt-0.5 break-words">
                      {currentRoom.name} is free from {startTime} to {endTime}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-red-700">Unavailable</p>
                    <p className="text-sm text-slate-600 mt-0.5 break-words">{result.reason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected room details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Room details</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" /> Room</dt>
                  <dd className="font-medium text-slate-900 text-right min-w-0 break-words">{currentRoom.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 flex items-center gap-1.5 shrink-0"><Building2 className="w-3.5 h-3.5" /> Building</dt>
                  <dd className="font-medium text-slate-900 text-right min-w-0 break-words">{currentRoom.building}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 flex items-center gap-1.5 shrink-0"><Users className="w-3.5 h-3.5" /> Capacity</dt>
                  <dd className="font-medium text-slate-900 text-right shrink-0">{currentRoom.capacity} seats</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 flex items-center gap-1.5 shrink-0"><Lock className="w-3.5 h-3.5" /> Status</dt>
                  <dd className={`font-medium text-right shrink-0 ${currentRoom.blocked ? 'text-red-600' : 'text-emerald-600'}`}>
                    {currentRoom.blocked ? 'Blocked' : 'Open'}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Existing bookings for selected room */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Existing bookings — {currentRoom.name}
          </h2>
          {roomBookings.length === 0 ? (
            <p className="text-sm text-slate-400">No existing bookings for this room.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {roomBookings.map((b) => (
                <li key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm font-medium text-slate-700">{b.bookedBy}</span>
                  <span className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
