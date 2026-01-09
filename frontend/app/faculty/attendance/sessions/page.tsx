// app/faculty/attendance/sessions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface Session {
  id: string;
  session_code: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  present_count?: number;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    
    // Auto-refresh every 10 seconds to show real-time present count
    const interval = setInterval(() => {
      fetchSessions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      // Only show loading spinner on initial load
      if (sessions.length === 0) {
        setLoading(true);
      }
      const response = await apiClient.get("/faculty/attendance/sessions");
      console.log("Sessions response:", response.data);
      setSessions(response.data.sessions || []);
    } catch (error: any) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Session Code", accessor: "session_code" },
    { header: "Course", accessor: "course_code" },
    {
      header: "Start Time",
      accessor: "start_time",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      header: "End Time",
      accessor: "end_time",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      header: "Present",
      accessor: "present_count",
      render: (value: number | string) => {
        const count = typeof value === 'string' ? parseInt(value) : (value || 0);
        return (
          <span className={`font-semibold ${count > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {count}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string) => (
        <button
          onClick={() => router.push(`/faculty/attendance/session/${value}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Sessions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all your attendance sessions
          </p>
        </div>
        <button
          onClick={() => router.push("/faculty/attendance/create")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Session
        </button>
      </div>

      <Table columns={columns} data={sessions} loading={loading} />
    </div>
  );
}

