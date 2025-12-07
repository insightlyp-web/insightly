// app/hod/timetable/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface TimetableEntry {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  room_no?: string;
}

const dayMap: { [key: string]: string } = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const reverseDayMap: { [key: string]: string } = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

interface Course {
  id: string;
  code: string;
  name: string;
}

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: "Monday",
    start_time: "",
    end_time: "",
    course_id: "",
    room_no: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, coursesRes] = await Promise.all([
        apiClient.get("/hod/timetable"),
        apiClient.get("/hod/courses"),
      ]);

      setTimetable(timetableRes.data.timetable || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch data",
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

      // Convert frontend format (Monday) to backend format (Mon)
      const submitData = {
        ...formData,
        day_of_week: reverseDayMap[formData.day_of_week] || formData.day_of_week,
      };

      if (editingId) {
        await apiClient.put(`/hod/timetable/${editingId}`, submitData);
        setMessage({ type: "success", text: "✅ Timetable entry updated successfully!" });
      } else {
        await apiClient.post("/hod/timetable", submitData);
        setMessage({ type: "success", text: "✅ Timetable entry created successfully! Students can now see it in their dashboard." });
      }

      setFormData({ day_of_week: "Monday", start_time: "", end_time: "", course_id: "", room_no: "" });
      setShowForm(false);
      setEditingId(null);
      await fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save timetable entry",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingId(entry.id);
    // Convert backend format (Mon) to frontend format (Monday)
    const dayInFrontendFormat = dayMap[entry.day_of_week] || entry.day_of_week;
    setFormData({
      day_of_week: dayInFrontendFormat,
      start_time: entry.start_time,
      end_time: entry.end_time,
      course_id: courses.find((c) => c.code === entry.course_code)?.id || "",
      room_no: entry.room_no || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return;

    try {
      await apiClient.delete(`/hod/timetable/${id}`);
      setMessage({ type: "success", text: "Timetable entry deleted successfully" });
      await fetchData();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete timetable entry",
      });
    }
  };

  const columns = [
    { 
      header: "Day", 
      accessor: "day_of_week",
      render: (value: string) => dayMap[value] || value
    },
    { header: "Start Time", accessor: "start_time" },
    { header: "End Time", accessor: "end_time" },
    { header: "Course", accessor: "course_code" },
    { header: "Room", accessor: "room_no", render: (value: string) => value || "-" },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string, row: TimetableEntry) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(value)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage department timetable
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ day_of_week: "Monday", start_time: "", end_time: "", course_id: "", room_no: "" });
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Entry"}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Timetable Entry" : "Create New Timetable Entry"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Day</label>
              <select
                required
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <select
                required
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Room Number (Optional)</label>
              <input
                type="text"
                value={formData.room_no}
                onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., A101"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update Entry" : "Create Entry"}
            </button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Timetable Entries ({timetable.length})
        </h2>
        <Table columns={columns} data={timetable} loading={loading} />
      </div>
    </div>
  );
}

