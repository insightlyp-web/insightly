// app/student/courses/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";

interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  year: number;
  faculty_name?: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size={32} className="text-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Courses you are enrolled in
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">You are not enrolled in any courses yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/student/courses/${course.id}`)}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.code}</h3>
              <p className="text-sm text-gray-600 mb-3">{course.name}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Department: {course.department}</p>
                <p>Year: {course.year}</p>
                {course.faculty_name && <p>Faculty: {course.faculty_name}</p>}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/student/courses/${course.id}`);
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details →
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

