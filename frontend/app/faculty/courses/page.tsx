// app/faculty/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  year: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/faculty/courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Course Code", accessor: "code" },
    { header: "Course Name", accessor: "name" },
    { header: "Year", accessor: "year" },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string, row: Course) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/faculty/courses/${value}/students`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Students
          </button>
          <button
            onClick={() => router.push(`/faculty/attendance/course/${value}`)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Attendance
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Courses you are teaching
        </p>
      </div>

      <Table columns={columns} data={courses} loading={loading} />
    </div>
  );
}

