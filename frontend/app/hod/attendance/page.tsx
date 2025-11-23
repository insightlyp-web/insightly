// app/hod/attendance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface AttendanceRecord {
  student_name: string;
  course_code: string;
  attendance_percentage: number | string;
  total_sessions: number | string;
  attended_sessions: number | string;
}

interface DailyAttendance {
  date: string;
  attendance: number;
}

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [dailyData, setDailyData] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceData();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get("/hod/courses");
      setCourses(response.data.courses || []);
      if (response.data.courses?.length > 0) {
        setSelectedCourse(response.data.courses[0].id);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch courses",
      });
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [studentsRes, courseRes] = await Promise.all([
        apiClient.get("/hod/attendance/students"),
        selectedCourse 
          ? apiClient.get(`/hod/attendance/course/${selectedCourse}`).catch(() => ({ data: { daily: [] } }))
          : Promise.resolve({ data: { daily: [] } }),
      ]);

      // Filter by selected course if one is selected
      let attendance = studentsRes.data.attendance || [];
      if (selectedCourse) {
        const selectedCourseCode = courses.find(c => c.id === selectedCourse)?.code;
        attendance = attendance.filter((a: AttendanceRecord) => a.course_code === selectedCourseCode);
      }
      setAttendanceData(attendance);
      
      // Transform daily data for chart
      const daily = courseRes.data.daily || [];
      const chartData = daily.map((d: any) => ({
        date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendance: parseFloat(d.attendance_percentage) || 0,
      }));
      setDailyData(chartData);
    } catch (error: any) {
      console.error("Attendance fetch error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch attendance data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate distribution for bar chart
  const getAttendancePercentage = (value: any): number => {
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value || 0;
  };

  const distributionData = [
    { range: "90-100%", count: attendanceData.filter((a) => getAttendancePercentage(a.attendance_percentage) >= 90).length },
    { range: "75-89%", count: attendanceData.filter((a) => {
      const pct = getAttendancePercentage(a.attendance_percentage);
      return pct >= 75 && pct < 90;
    }).length },
    { range: "50-74%", count: attendanceData.filter((a) => {
      const pct = getAttendancePercentage(a.attendance_percentage);
      return pct >= 50 && pct < 75;
    }).length },
    { range: "<50%", count: attendanceData.filter((a) => getAttendancePercentage(a.attendance_percentage) < 50).length },
  ];

  const columns = [
    { header: "Student Name", accessor: "student_name" },
    { header: "Course", accessor: "course_code" },
    {
      header: "Attendance %",
      accessor: "attendance_percentage",
      render: (value: any) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
        return `${Number(numValue).toFixed(1)}%`;
      },
    },
    {
      header: "Sessions",
      accessor: "attended_sessions",
      render: (value: any, row: AttendanceRecord) => {
        const attended = typeof row.attended_sessions === 'string' ? parseInt(row.attended_sessions) : (row.attended_sessions || 0);
        const total = typeof row.total_sessions === 'string' ? parseInt(row.total_sessions) : (row.total_sessions || 0);
        return `${attended}/${total}`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          View attendance statistics and trends
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Distribution
          </h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Attendance Trend
          </h3>
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
              {selectedCourse 
                ? "No attendance data for this course. Select a course with attendance sessions."
                : "Select a course to view daily attendance trends"}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Student Attendance Details ({attendanceData.length})
        </h2>
        <Table columns={columns} data={attendanceData} loading={loading} />
      </div>
    </div>
  );
}

