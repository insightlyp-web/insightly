// app/student/timetable/today/page.tsx
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

export default function TodayTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    fetchTimetable();
    
    // Refresh timetable every 30 seconds to catch new entries
    const interval = setInterval(() => {
      fetchTimetable();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchTimetable = async () => {
    try {
      // Only show loading spinner on initial load
      if (timetable.length === 0) {
        setLoading(true);
      }
      const response = await apiClient.get("/student/timetable/today");
      setTimetable(response.data.timetable || []);
    } catch (error: any) {
      console.error("Failed to fetch timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size={32} className="text-blue-600 mx-auto" />
      </div>
    );
  }

  // Sort by start time
  const sortedTimetable = [...timetable].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today's Timetable</h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      {sortedTimetable.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No classes scheduled for today</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTimetable.map((entry) => (
            <Card key={entry.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{entry.course_code}</h3>
                  <p className="text-sm text-gray-600">{entry.course_name}</p>
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {entry.start_time} - {entry.end_time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {entry.faculty_name}
                </div>
                {entry.room_no && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Room: {entry.room_no}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

