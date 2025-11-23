// components/faculty/AttendanceSessionForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface AttendanceSessionFormProps {
  courses: Course[];
  onSubmit: (data: { course_id: string; start_time: string; end_time: string }) => Promise<void>;
  loading?: boolean;
}

export function AttendanceSessionForm({ courses, onSubmit, loading }: AttendanceSessionFormProps) {
  // Helper to get current datetime in local format for datetime-local input
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper to get datetime 1 hour from now
  const getOneHourLater = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    course_id: "",
    start_time: getCurrentDateTimeLocal(),
    end_time: getOneHourLater(),
  });
  const [error, setError] = useState("");

  // Validate end time is after start time
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start) {
        setError("End time must be after start time");
      } else {
        setError("");
      }
    }
  }, [formData.start_time, formData.end_time]);

  const handleStartNow = () => {
    const now = getCurrentDateTimeLocal();
    const oneHourLater = getOneHourLater();
    setFormData({
      ...formData,
      start_time: now,
      end_time: oneHourLater,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id || !formData.start_time || !formData.end_time) {
      setError("Please fill in all fields");
      return;
    }
    
    if (error) {
      return;
    }

    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }

    setError("");
    await onSubmit(formData);
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Create Attendance Session</h2>
        <p className="text-sm text-gray-500 mt-1">
          Students will scan the QR code to mark their attendance during the session time window.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.course_id}
            onChange={(e) => {
              setFormData({ ...formData, course_id: e.target.value });
              setError("");
            }}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleStartNow}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Start Now
              </button>
            </div>
            <input
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={(e) => {
                setFormData({ ...formData, start_time: e.target.value });
                setError("");
              }}
              min={getCurrentDateTimeLocal()}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">When students can start marking attendance</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={(e) => {
                setFormData({ ...formData, end_time: e.target.value });
                setError("");
              }}
              min={formData.start_time || getCurrentDateTimeLocal()}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">When attendance marking closes</p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> After creating the session, a QR code will be generated. 
            Display it to students so they can scan and mark their attendance.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !!error}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Session..." : "Create Session"}
          </button>
        </div>
      </form>
    </Card>
  );
}

