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
    if (!selectedCourse || !selectedFaculty) {
      setMessage({
        type: "error",
        text: "Please select both course and faculty",
      });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      await apiClient.put(`/hod/courses/${selectedCourse}/map-faculty`, {
        faculty_id: selectedFaculty,
      });

      setMessage({
        type: "success",
        text: "Course mapped to faculty successfully",
      });

      setSelectedCourse("");
      setSelectedFaculty("");
      await fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to map course",
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
      header: "Assigned Faculty", 
      accessor: "faculty_id",
      render: (value: string) => {
        const facultyMember = faculty.find((f) => f.id === value);
        return facultyMember ? facultyMember.full_name : "Unknown";
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Faculty to Course</h2>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Course</label>
            <select
              required
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
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
              required
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Choose a faculty member...</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Assigning..." : "Assign Faculty"}
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

