// app/student/events/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  venue?: string;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/events");
      setEvents(response.data.events || []);
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upcoming and past events
        </p>
      </div>

      {sortedEvents.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No events scheduled</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.map((event) => {
            const eventDate = new Date(event.event_date);
            const isPast = eventDate < new Date();
            
            return (
              <Card key={event.id} className={isPast ? "opacity-75" : ""}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  {isPast && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      Past
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>Date:</strong> {eventDate.toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {eventDate.toLocaleTimeString()}
                  </p>
                  {event.venue && (
                    <p>
                      <strong>Venue:</strong> {event.venue}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

