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

interface SubjectAttendance {
  course_id: string;
  course_code: string;
  course_name: string;
  year: number;
  academic_year?: string;
  semester?: number;
  total_sessions: number;
  total_students: number;
  total_attendance_records: number;
  avg_attendance_percentage: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttendance, setShowAttendance] = useState(false);

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

  const fetchSubjectAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/faculty/attendance/subjects");
      const subjects = response.data.subjects || [];
      setSubjectAttendance(subjects);
      setShowAttendance(true);
      
      if (subjects.length === 0) {
        // Show a helpful message if no courses are assigned
        alert("No courses assigned. Please ask your HOD to map courses to you using the 'Map Courses' page.");
      }
    } catch (error: any) {
      console.error("Failed to fetch subject attendance:", error);
      alert(error.response?.data?.message || "Failed to fetch subject attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const courseColumns = [
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

  const attendanceColumns = [
    { header: "Subject Code", accessor: "course_code" },
    { header: "Subject Name", accessor: "course_name" },
    { 
      header: "Year", 
      accessor: "year",
      render: (value: number) => value ? `Year ${value}` : "-"
    },
    { 
      header: "Academic Year", 
      accessor: "academic_year",
      render: (value: string) => value || "-"
    },
    { 
      header: "Semester", 
      accessor: "semester",
      render: (value: number) => {
        if (!value) return "-";
        return value === 1 ? "I" : value === 2 ? "II" : value === 3 ? "III" : value === 4 ? "IV" : value.toString();
      }
    },
    { 
      header: "Total Sessions", 
      accessor: "total_sessions",
      render: (value: number) => value || 0
    },
    { 
      header: "Enrolled Students", 
      accessor: "total_students",
      render: (value: number) => value || 0
    },
    { 
      header: "Avg Attendance %", 
      accessor: "avg_attendance_percentage",
      render: (value: number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
        const color = numValue >= 75 ? "text-green-600" : numValue >= 60 ? "text-yellow-600" : "text-red-600";
        return <span className={color}>{Number(numValue).toFixed(1)}%</span>;
      }
    },
    {
      header: "Actions",
      accessor: "course_id",
      render: (value: string) => (
        <button
          onClick={() => router.push(`/faculty/attendance/course/${value}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {showAttendance ? "Subject-wise attendance summary" : "Courses you are teaching"}
          </p>
        </div>
        <div className="flex space-x-2">
          {!showAttendance ? (
            <button
              onClick={fetchSubjectAttendance}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              View Subject Attendance
            </button>
          ) : (
            <button
              onClick={() => setShowAttendance(false)}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Back to Courses
            </button>
          )}
        </div>
      </div>

      {showAttendance ? (
        <div>
          {subjectAttendance.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</p>
                <p className="text-sm text-gray-500 mb-4">
                  You don't have any courses assigned to you yet.
                </p>
                <p className="text-sm text-gray-600">
                  Please contact your HOD to map courses to you using the <strong>"Map Courses"</strong> page.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <p className="text-sm text-gray-500">Total Subjects</p>
                  <p className="text-2xl font-semibold text-gray-900">{subjectAttendance.length}</p>
                </Card>
                <Card>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {subjectAttendance.reduce((sum, s) => sum + (s.total_sessions || 0), 0)}
                  </p>
                </Card>
                <Card>
                  <p className="text-sm text-gray-500">Overall Avg Attendance</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {subjectAttendance.length > 0
                      ? (
                          subjectAttendance.reduce((sum, s) => sum + (s.avg_attendance_percentage || 0), 0) /
                          subjectAttendance.length
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </Card>
              </div>
              <Table columns={attendanceColumns} data={subjectAttendance} loading={loading} />
            </>
          )}
        </div>
      ) : (
        <Table columns={courseColumns} data={courses} loading={loading} />
      )}
    </div>
  );
}

