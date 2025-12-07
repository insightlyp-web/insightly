// app/hod/report/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";

interface WeeklyReport {
  week_start: string;
  week_end: string;
  total_sessions: number;
  total_courses: number;
  total_students: number;
  total_attendance_records: number;
  avg_attendance_percentage: number;
}

interface MonthlyReport {
  month_start: string;
  month_name: string;
  year: number;
  month: number;
  total_sessions: number;
  total_courses: number;
  total_students: number;
  total_attendance_records: number;
  avg_attendance_percentage: number;
}

interface CourseBreakdown {
  week_start?: string;
  month_start?: string;
  month_name?: string;
  course_id: string;
  course_code: string;
  course_name: string;
  total_sessions: number;
  total_students: number;
  total_attendance_records: number;
  avg_attendance_percentage: number;
}

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [weeklyData, setWeeklyData] = useState<WeeklyReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [weeklyCourseBreakdown, setWeeklyCourseBreakdown] = useState<CourseBreakdown[]>([]);
  const [monthlyCourseBreakdown, setMonthlyCourseBreakdown] = useState<CourseBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "weekly") {
        const response = await apiClient.get("/hod/reports/weekly");
        setWeeklyData(response.data.weekly || []);
        setWeeklyCourseBreakdown(response.data.courseBreakdown || []);
      } else {
        const response = await apiClient.get("/hod/reports/monthly");
        setMonthlyData(response.data.monthly || []);
        setMonthlyCourseBreakdown(response.data.courseBreakdown || []);
      }
    } catch (err: any) {
      console.error("Report fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const getAttendanceColor = (percentage: number | string) => {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(num)) return "text-gray-600";
    if (num >= 75) return "text-green-600";
    if (num >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const parsePercentage = (value: number | string): number => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value || 0;
  };

  const weeklyColumns = [
    { header: "Week", accessor: "week" },
    { header: "Total Sessions", accessor: "total_sessions" },
    { header: "Courses", accessor: "total_courses" },
    { header: "Students", accessor: "total_students" },
    { header: "Attendance Records", accessor: "total_attendance_records" },
    { header: "Avg Attendance %", accessor: "avg_attendance_percentage" },
  ];

  const monthlyColumns = [
    { header: "Month", accessor: "month" },
    { header: "Total Sessions", accessor: "total_sessions" },
    { header: "Courses", accessor: "total_courses" },
    { header: "Students", accessor: "total_students" },
    { header: "Attendance Records", accessor: "total_attendance_records" },
    { header: "Avg Attendance %", accessor: "avg_attendance_percentage" },
  ];

  const courseBreakdownColumns = [
    { header: activeTab === "weekly" ? "Week" : "Month", accessor: "period" },
    { header: "Course Code", accessor: "course_code" },
    { header: "Course Name", accessor: "course_name" },
    { header: "Sessions", accessor: "total_sessions" },
    { header: "Students", accessor: "total_students" },
    { header: "Records", accessor: "total_attendance_records" },
    { header: "Avg %", accessor: "avg_attendance_percentage" },
  ];

  const weeklyTableData = weeklyData.map((week) => {
    const percentage = parsePercentage(week.avg_attendance_percentage);
    return {
      week: formatWeekRange(week.week_start, week.week_end),
      total_sessions: week.total_sessions,
      total_courses: week.total_courses,
      total_students: week.total_students,
      total_attendance_records: week.total_attendance_records,
      avg_attendance_percentage: (
        <span className={getAttendanceColor(percentage)}>
          {percentage.toFixed(2)}%
        </span>
      ),
    };
  });

  const monthlyTableData = monthlyData.map((month) => {
    const percentage = parsePercentage(month.avg_attendance_percentage);
    return {
      month: month.month_name.trim(),
      total_sessions: month.total_sessions,
      total_courses: month.total_courses,
      total_students: month.total_students,
      total_attendance_records: month.total_attendance_records,
      avg_attendance_percentage: (
        <span className={getAttendanceColor(percentage)}>
          {percentage.toFixed(2)}%
        </span>
      ),
    };
  });

  const courseBreakdownData = (activeTab === "weekly" ? weeklyCourseBreakdown : monthlyCourseBreakdown).map((course) => {
    let period = "";
    if (activeTab === "weekly") {
      const weekStart = new Date(course.week_start!);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      period = formatWeekRange(course.week_start!, weekEnd.toISOString().split('T')[0]);
    } else {
      period = course.month_name?.trim() || formatDate(course.month_start!);
    }
    const percentage = parsePercentage(course.avg_attendance_percentage);
    return {
      period,
      course_code: course.course_code,
      course_name: course.course_name,
      total_sessions: course.total_sessions,
      total_students: course.total_students,
      total_attendance_records: course.total_attendance_records,
      avg_attendance_percentage: (
        <span className={getAttendanceColor(percentage)}>
          {percentage.toFixed(2)}%
        </span>
      ),
    };
  });

  // Chart data
  const weeklyChartData = weeklyData.map((week) => {
    const percentage = parsePercentage(week.avg_attendance_percentage);
    return {
      period: formatWeekRange(week.week_start, week.week_end),
      attendance: parseFloat(percentage.toFixed(2)),
      sessions: week.total_sessions,
    };
  });

  const monthlyChartData = monthlyData.map((month) => {
    const percentage = parsePercentage(month.avg_attendance_percentage);
    return {
      period: month.month_name.trim(),
      attendance: parseFloat(percentage.toFixed(2)),
      sessions: month.total_sessions,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          View weekly and monthly attendance reports for your department
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "weekly"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "monthly"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Monthly Report
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Spinner size={32} className="text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Chart */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Average Attendance Trend - {activeTab === "weekly" ? "Weekly" : "Monthly"}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={activeTab === "weekly" ? weeklyChartData : monthlyChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} label={{ value: "Attendance %", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Summary Table */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {activeTab === "weekly" ? "Weekly" : "Monthly"} Summary
            </h2>
            <Table
              columns={activeTab === "weekly" ? weeklyColumns : monthlyColumns}
              data={activeTab === "weekly" ? weeklyTableData : monthlyTableData}
            />
          </Card>

          {/* Course-wise Breakdown */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Course-wise Breakdown
            </h2>
            {courseBreakdownData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  columns={courseBreakdownColumns}
                  data={courseBreakdownData}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No course breakdown data available
              </p>
            )}
          </Card>

          {/* Bar Chart for Sessions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Total Sessions - {activeTab === "weekly" ? "Weekly" : "Monthly"}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={activeTab === "weekly" ? weeklyChartData : monthlyChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#2563eb" name="Total Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
