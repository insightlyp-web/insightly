// app/faculty/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";

interface Stats {
  courses: number;
  sessions: number;
  assessments: number;
}

interface Session {
  id: string;
  session_code: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  present_count?: number;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    courses: 0,
    sessions: 0,
    assessments: 0,
  });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, sessionsRes, assessmentsRes] = await Promise.all([
        apiClient.get("/faculty/courses").catch(() => ({ data: { courses: [] } })),
        apiClient.get("/faculty/attendance/sessions").catch(() => ({ data: { sessions: [] } })),
        apiClient.get("/faculty/marks/assessments").catch(() => ({ data: { assessments: [] } })),
      ]);

      setStats({
        courses: coursesRes.data.courses?.length || 0,
        sessions: sessionsRes.data.sessions?.length || 0,
        assessments: assessmentsRes.data.assessments?.length || 0,
      });

      // Get recent 5 sessions
      const sessions = sessionsRes.data.sessions || [];
      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { name: "Total Courses", value: stats.courses, icon: "/icons_faculty/Courses.png", color: "bg-blue-100 text-blue-600" },
    { name: "Sessions Created", value: stats.sessions, icon: "/icons_faculty/Sessions Created.png", color: "bg-green-100 text-green-600" },
    { name: "Assessments", value: stats.assessments, icon: "/icons_faculty/Assessments.png", color: "bg-purple-100 text-purple-600" },
  ];

  const sessionColumns = [
    { header: "Session Code", accessor: "session_code" },
    { header: "Course", accessor: "course_code" },
    {
      header: "Start Time",
      accessor: "start_time",
      render: (value: string) => new Date(value).toLocaleString(),
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your teaching activities
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Spinner size={32} className="text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {statsData.map((stat) => (
              <Card key={stat.name}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                    <Image 
                      src={stat.icon} 
                      alt={stat.name} 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/faculty/attendance/create")}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Start Attendance Session
                </button>
                <button
                  onClick={() => router.push("/faculty/attendance/sessions")}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View Attendance Summary
                </button>
                <button
                  onClick={() => router.push("/faculty/marks/assessments/create")}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Assessment
                </button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.session_code}</p>
                        <p className="text-xs text-gray-500">{session.course_code}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/faculty/attendance/session/${session.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent sessions</p>
              )}
            </Card>
          </div>

          {recentSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Sessions</h2>
              <Table columns={sessionColumns} data={recentSessions} loading={false} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

