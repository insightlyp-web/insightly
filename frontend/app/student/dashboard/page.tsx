// app/student/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/student/Card";
import { PlacementCard } from "@/components/student/PlacementCard";
import { AIRecommendedPlacements } from "@/components/student/AIRecommendedPlacements";
import { AIAttendanceInsights } from "@/components/student/AIAttendanceInsights";
import apiClient from "@/lib/axios";

interface DashboardData {
  profile: {
    id: string;
    full_name: string;
    email: string;
    department: string;
    academic_year?: string;
    student_year?: string;
    roll_number?: string;
  };
  attendance_summary: {
    present_count: number;
  };
  today_timetable: Array<{
    id: string;
    course_code: string;
    course_name: string;
    faculty_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_no: string;
  }>;
  recent_placements: Array<{
    id: string;
    title: string;
    company_name: string;
    job_type: string;
    package?: string;
    deadline?: string;
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
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
      const response = await apiClient.get("/student/dashboard");
      console.log("Dashboard API response:", response.data);
      
      // Transform response to match expected format
      const transformedData: DashboardData = {
        profile: response.data.profile || null,
        attendance_summary: response.data.attendance_summary || { present_count: 0 },
        today_timetable: response.data.today_timetable || response.data.timetable || [],
        recent_placements: response.data.recent_placements || [],
      };
      
      // Validate that profile exists
      if (!transformedData.profile) {
        console.error("Profile missing from dashboard response:", response.data);
        // Try to fetch profile separately
        try {
          const profileResponse = await apiClient.get("/student/profile");
          if (profileResponse.data?.profile) {
            transformedData.profile = profileResponse.data.profile;
          }
        } catch (profileError) {
          console.error("Failed to fetch profile separately:", profileError);
        }
      }
      
      setData(transformedData);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty data structure to prevent crashes
      setData({
        profile: null,
        attendance_summary: { present_count: 0 },
        today_timetable: [],
        recent_placements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { profile, attendance_summary, today_timetable, recent_placements } = data;

  // Safety check - if profile is missing, show error
  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Profile data is missing. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {profile?.full_name || "Student"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">{profile.department}</p>
            </div>
            {profile.roll_number && (
              <div>
                <p className="text-xs text-gray-500">Roll Number</p>
                <p className="text-sm font-medium text-gray-900">{profile.roll_number}</p>
              </div>
            )}
            {profile.student_year && (
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p className="text-sm font-medium text-gray-900">{profile.student_year}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h3>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{attendance_summary.present_count}</p>
            <p className="text-sm text-gray-500 mt-1">Sessions Attended</p>
          </div>
          <button
            onClick={() => router.push("/student/attendance/summary")}
            className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View Details
          </button>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/student/attendance/scan")}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Scan QR Code
            </button>
            <button
              onClick={() => router.push("/student/timetable/today")}
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Today's Timetable
            </button>
            <button
              onClick={() => router.push("/student/placement/posts")}
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              View Placements
            </button>
          </div>
        </Card>
      </div>

      {/* Today's Timetable */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Timetable</h2>
          <button
            onClick={() => router.push("/student/timetable/today")}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </button>
        </div>
        {today_timetable.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {today_timetable.map((item) => (
              <Card key={item.id}>
                <h4 className="font-semibold text-gray-900 mb-1">{item.course_code}</h4>
                <p className="text-sm text-gray-600 mb-2">{item.course_name}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Faculty: {item.faculty_name}</p>
                  <p>
                    {item.start_time} - {item.end_time}
                  </p>
                  {item.room_no && <p>Room: {item.room_no}</p>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-gray-500 text-center py-4">No classes scheduled for today</p>
          </Card>
        )}
      </div>

      {/* Recent Placements */}
      {recent_placements && recent_placements.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Placements</h2>
            <button
              onClick={() => router.push("/student/placement/posts")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent_placements.map((post) => (
              <PlacementCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* AI Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIRecommendedPlacements />
        <AIAttendanceInsights />
      </div>
    </div>
  );
}

