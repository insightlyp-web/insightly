// app/hod/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { StatsGrid } from "@/components/hod/StatsGrid";
import { Card } from "@/components/hod/Card";
import { AIAtRiskStudents } from "@/components/hod/AIAtRiskStudents";
import { AISkillGap } from "@/components/hod/AISkillGap";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";

export default function HODDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    courses: 0,
    timetable: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchStats = async () => {
      try {
        const [studentsRes, facultyRes, coursesRes, timetableRes] = await Promise.all([
          apiClient.get("/hod/students").catch(() => ({ data: { students: [] } })),
          apiClient.get("/hod/faculty").catch(() => ({ data: { faculty: [] } })),
          apiClient.get("/hod/courses").catch(() => ({ data: { courses: [] } })),
          apiClient.get("/hod/timetable").catch(() => ({ data: { timetable: [] } })),
        ]);

        setStats({
          students: studentsRes.data.students?.length || 0,
          faculty: facultyRes.data.faculty?.length || 0,
          courses: coursesRes.data.courses?.length || 0,
          timetable: timetableRes.data.timetable?.length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    { name: "Total Students", value: stats.students, icon: "/icons_hod/Students.png" },
    { name: "Total Faculty", value: stats.faculty, icon: "/icons_hod/Faculty.png" },
    { name: "Total Courses", value: stats.courses, icon: "/icons_hod/Courses.png" },
    { name: "Timetable Entries", value: stats.timetable, icon: "/icons_hod/Timetable.png" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your department
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Spinner size={32} className="text-blue-600" />
        </div>
      ) : (
        <>
          <StatsGrid stats={statsData} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="/hod/students"
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Upload Students
                </a>
                <a
                  href="/hod/faculty"
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Upload Faculty
                </a>
                <a
                  href="/hod/courses"
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Manage Courses
                </a>
                <a
                  href="/hod/timetable"
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Timetable
                </a>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
              <p className="text-sm text-gray-500">
                View detailed attendance analytics on the Attendance Analytics page.
              </p>
              <a
                href="/hod/attendance"
                className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Analytics
              </a>
            </Card>
          </div>

          {/* AI Features */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AIAtRiskStudents />
            <AISkillGap />
          </div>
        </>
      )}
    </div>
  );
}
