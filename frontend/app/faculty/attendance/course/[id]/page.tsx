// app/faculty/attendance/course/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import apiClient from "@/lib/axios";

interface StudentAttendance {
  student_name: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number | string;
}

interface DailyAttendance {
  date: string;
  attendance_percentage: number;
}

export default function CourseAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [courseInfo, setCourseInfo] = useState<{ code: string; name: string } | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [dailyData, setDailyData] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchAttendanceData();
    }
  }, [courseId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/faculty/attendance/course/${courseId}`);
      setCourseInfo(response.data.course || null);
      setStudents(response.data.students || []);
      
      // Transform daily data
      const daily = response.data.daily || [];
      const chartData = daily.map((d: any) => ({
        date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendance: parseFloat(d.attendance_percentage) || 0,
      }));
      setDailyData(chartData);
    } catch (error: any) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendancePercentage = (value: any): number => {
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value || 0;
  };

  const distributionData = [
    { range: "90-100%", count: students.filter((s) => getAttendancePercentage(s.attendance_percentage) >= 90).length },
    { range: "75-89%", count: students.filter((s) => {
      const pct = getAttendancePercentage(s.attendance_percentage);
      return pct >= 75 && pct < 90;
    }).length },
    { range: "50-74%", count: students.filter((s) => {
      const pct = getAttendancePercentage(s.attendance_percentage);
      return pct >= 50 && pct < 75;
    }).length },
    { range: "<50%", count: students.filter((s) => getAttendancePercentage(s.attendance_percentage) < 50).length },
  ];

  const columns = [
    { header: "Student Name", accessor: "student_name" },
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

  const totalSessions = students[0]?.total_sessions || 0;
  const avgAttendance = students.length > 0
    ? students.reduce((sum, s) => sum + getAttendancePercentage(s.attendance_percentage), 0) / students.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {courseInfo ? `${courseInfo.code} - Attendance Summary` : "Course Attendance"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Attendance statistics for this course
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-2xl font-semibold text-gray-900">{totalSessions}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Average Attendance</p>
          <p className="text-2xl font-semibold text-gray-900">{avgAttendance.toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Enrolled Students</p>
          <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
          {distributionData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No attendance data available
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No daily attendance data available
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Student Attendance Details ({students.length})
        </h2>
        <Table columns={columns} data={students} loading={loading} />
      </div>
    </div>
  );
}

