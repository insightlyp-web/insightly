// app/faculty/courses/[id]/students/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  academic_year?: string;
  student_year?: string;
  section?: string;
  roll_number?: string;
  attendance_percentage?: number;
}

export default function CourseStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<{ code: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/faculty/courses/${courseId}/students`);
      setStudents(response.data.students || []);
      setCourseInfo(response.data.course || null);
    } catch (error: any) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Roll Number", accessor: "roll_number", render: (value: string) => value || "-" },
    { header: "Name", accessor: "full_name" },
    { header: "Year", accessor: "student_year", render: (value: string) => value || "-" },
    { header: "Section", accessor: "section", render: (value: string) => value || "-" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone", render: (value: string) => value || "-" },
    {
      header: "Attendance %",
      accessor: "attendance_percentage",
      render: (value: any) => {
        if (value === undefined || value === null) return "-";
        const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
        return `${Number(numValue).toFixed(1)}%`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
          >
            ← Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {courseInfo ? `${courseInfo.code} - ${courseInfo.name}` : "Students"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enrolled students in this course
          </p>
        </div>
        <button
          onClick={() => router.push(`/faculty/marks/assessments/create?course_id=${courseId}`)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Assessment
        </button>
      </div>

      <Table columns={columns} data={students} loading={loading} />
    </div>
  );
}

