// app/student/attendance/history/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Table } from "@/components/student/Table";
import apiClient from "@/lib/axios";

interface AttendanceHistory {
  session_code: string;
  course_name: string;
  start_time: string;
  timestamp: string;
}

export default function AttendanceHistoryPage() {
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/attendance/history");
      setHistory(response.data.history || []);
    } catch (error: any) {
      console.error("Failed to fetch attendance history:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Session Code", accessor: "session_code" },
    { header: "Course Name", accessor: "course_name" },
    {
      header: "Session Date",
      accessor: "start_time",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      header: "Marked At",
      accessor: "timestamp",
      render: (value: string) => value ? new Date(value).toLocaleString() : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="mt-1 text-sm text-gray-500">
          All your attendance records
        </p>
      </div>

      <Table columns={columns} data={history} loading={loading} />
    </div>
  );
}

