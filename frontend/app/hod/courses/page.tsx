// app/hod/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  year: number;
  academic_year?: string;
  semester?: number;
  faculty_id?: string;
  faculty_name?: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    year: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/hod/courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch courses",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);

      await apiClient.post("/hod/courses", formData);

      setMessage({
        type: "success",
        text: "Course created successfully",
      });

      setFormData({ code: "", name: "", year: 1 });
      setShowForm(false);
      await fetchCourses();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create course",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: "Code", accessor: "code" },
    { header: "Name", accessor: "name" },
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
        return value === 1 ? "I" : value === 2 ? "II" : value.toString();
      }
    },
    { 
      header: "Faculty", 
      accessor: "faculty_name", 
      render: (value: string, row: Course) => value || (row.faculty_id ? "Assigned" : "Unassigned")
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage department courses
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Course"}
        </button>
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

      {showForm && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Course</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., CSE101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Introduction to Programming"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Course"}
            </button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Department Courses ({courses.length})
        </h2>
        <Table columns={columns} data={courses} loading={loading} />
      </div>
    </div>
  );
}

