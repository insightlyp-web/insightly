// app/student/timetable/week/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

interface TimetableEntry {
  id: string;
  course_code: string;
  course_name: string;
  faculty_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_no: string;
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayNames = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday',
};

export default function WeeklyTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/timetable");
      setTimetable(response.data.timetable || []);
    } catch (error: any) {
      console.error("Failed to fetch timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group timetable by day
  const timetableByDay = daysOfWeek.map(day => ({
    day,
    entries: timetable
      .filter(entry => entry.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size={32} className="text-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Timetable</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your complete weekly schedule
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {timetableByDay.map(({ day, entries }) => (
          <Card key={day}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {dayNames[day as keyof typeof dayNames] || day}
            </h3>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">No classes</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="pb-3 border-b border-gray-200 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-semibold text-gray-900">{entry.course_code}</p>
                        <p className="text-xs text-gray-600">{entry.course_name}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      <p>{entry.start_time} - {entry.end_time}</p>
                      <p>Faculty: {entry.faculty_name}</p>
                      {entry.room_no && <p>Room: {entry.room_no}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

