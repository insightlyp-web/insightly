// app/student/courses/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  year: number;
  faculty_name?: string;
  faculty_id?: string;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/student/courses/${courseId}`);
      setCourse(response.data.course || null);
    } catch (error: any) {
      console.error("Failed to fetch course:", error);
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

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{course.code}</h1>
        <p className="mt-1 text-sm text-gray-500">{course.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Course Code</p>
              <p className="text-sm font-medium text-gray-900">{course.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Course Name</p>
              <p className="text-sm font-medium text-gray-900">{course.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">{course.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Year</p>
              <p className="text-sm font-medium text-gray-900">{course.year}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Information</h3>
          {course.faculty_name ? (
            <div>
              <p className="text-xs text-gray-500">Faculty Name</p>
              <p className="text-sm font-medium text-gray-900">{course.faculty_name}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No faculty assigned</p>
          )}
        </Card>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => router.push(`/student/attendance/summary?course_id=${courseId}`)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View Attendance
        </button>
        <button
          onClick={() => router.push(`/student/timetable/today?course_id=${courseId}`)}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          View Timetable
        </button>
      </div>
    </div>
  );
}

