// app/hod/courses/map/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
  academic_year?: string;
  semester?: number;
}

interface Faculty {
  id: string;
  full_name: string;
  email: string;
}

export default function MapCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, facultyRes] = await Promise.all([
        apiClient.get("/hod/courses"),
        apiClient.get("/hod/faculty"),
      ]);

      setCourses(coursesRes.data.courses || []);
      setFaculty(facultyRes.data.faculty || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setMessage({
        type: "error",
        text: "Please select a course",
      });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const payload: any = {};
      if (selectedFaculty && selectedFaculty !== "") {
        payload.faculty_id = selectedFaculty;
      } else if (selectedFaculty === "") {
        // Allow unassigning faculty by sending null
        payload.faculty_id = null;
      }
      if (academicYear && academicYear !== "") {
        payload.academic_year = academicYear;
      }
      if (semester !== "") {
        payload.semester = semester;
      }

      if (Object.keys(payload).length === 0) {
        setMessage({
          type: "error",
          text: "Please select at least one field to update",
        });
        setSubmitting(false);
        return;
      }

      await apiClient.put(`/hod/courses/${selectedCourse}/map-faculty`, payload);

      setMessage({
        type: "success",
        text: "Course updated successfully",
      });

      setSelectedCourse("");
      setSelectedFaculty("");
      setAcademicYear("");
      setSemester("");
      await fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update course",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const mappedCourses = courses.filter((c: any) => c.faculty_id);

  const columns = [
    { header: "Course Code", accessor: "code" },
    { header: "Course Name", accessor: "name" },
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
      header: "Assigned Faculty", 
      accessor: "faculty_id",
      render: (value: string) => {
        const facultyMember = faculty.find((f) => f.id === value);
        return facultyMember ? facultyMember.full_name : "Unassigned";
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Map Courses to Faculty</h1>
        <p className="mt-1 text-sm text-gray-500">
          Assign faculty members to courses
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Map Course to Faculty</h2>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Course</label>
            <select
              required
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                // Pre-fill academic year and semester if course has them
                const course = courses.find((c) => c.id === e.target.value);
                if (course) {
                  setAcademicYear(course.academic_year || "");
                  setSemester(course.semester || "");
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Faculty</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Choose a faculty member (optional)...</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2024-25"
              className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Format: YYYY-YY (e.g., 2024-25)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select semester (optional)...</option>
              <option value="1">Semester I</option>
              <option value="2">Semester II</option>
              <option value="3">Semester III</option>
              <option value="4">Semester IV</option>
              <option value="5">Semester V</option>
              <option value="6">Semester VI</option>
              <option value="7">Semester VII</option>
              <option value="8">Semester VIII</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update Course"}
          </button>
        </form>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Mappings ({mappedCourses.length})
        </h2>
        <Table columns={columns} data={mappedCourses} loading={loading} />
      </div>
    </div>
  );
}

