// app/student/attendance/summary/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/student/Card";
import { Table } from "@/components/student/Table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import apiClient from "@/lib/axios";

interface AttendanceSummary {
  present_count: number | string;
}

interface WeeklyTrend {
  week: string;
  attendance: number;
}

interface AttendanceRecord {
  course_code: string;
  course_name: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
}

export default function AttendanceSummaryPage() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/attendance/summary");
      setSummary(response.data.summary || null);
      setWeeklyTrend(response.data.weekly_trend || []);
      setRecords(response.data.by_course || []);
    } catch (error: any) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Course Code", accessor: "course_code" },
    { header: "Course Name", accessor: "course_name" },
    {
      header: "Total Sessions",
      accessor: "total_sessions",
      render: (value: any) => typeof value === 'string' ? parseInt(value) : (value || 0),
    },
    {
      header: "Attended",
      accessor: "attended_sessions",
      render: (value: any) => typeof value === 'string' ? parseInt(value) : (value || 0),
    },
    {
      header: "Attendance %",
      accessor: "attendance_percentage",
      render: (value: any) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
        return `${Number(numValue).toFixed(1)}%`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Summary</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your overall attendance statistics
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500">Sessions Attended</p>
            <p className="text-2xl font-semibold text-gray-900">
              {typeof summary.present_count === 'string' ? parseInt(summary.present_count) : (summary.present_count || 0)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-semibold text-gray-900">{records.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Courses Tracked</p>
            <p className="text-2xl font-semibold text-blue-600">
              {new Set(records.map(r => r.course_code)).size}
            </p>
          </Card>
        </div>
      )}

      {weeklyTrend.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#2563eb"
                name="Attendance %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance by Course ({records.length})
        </h2>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  );
}

