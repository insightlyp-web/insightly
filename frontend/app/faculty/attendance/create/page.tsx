// app/faculty/attendance/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AttendanceSessionForm } from "@/components/faculty/AttendanceSessionForm";
import { QRCodeModal } from "@/components/faculty/QRCodeModal";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface SessionResponse {
  session: {
    id: string;
    session_code: string;
  };
}

export default function CreateAttendancePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get("/faculty/courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch courses",
      });
    }
  };

  const handleSubmit = async (data: { course_id: string; start_time: string; end_time: string }) => {
    try {
      setLoading(true);
      setMessage(null);

      // Convert datetime-local to ISO string
      const startTime = new Date(data.start_time).toISOString();
      const endTime = new Date(data.end_time).toISOString();

      const response = await apiClient.post<SessionResponse>("/faculty/attendance/sessions", {
        course_id: data.course_id,
        start_time: startTime,
        end_time: endTime,
      });

      const session = response.data.session;
      const selectedCourse = courses.find((c) => c.id === data.course_id);

      setSessionCode(session.session_code);
      setCourseName(selectedCourse?.name || "");
      setQrModalOpen(true);
      setMessage({
        type: "success",
        text: "Attendance session created successfully!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create attendance session",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Attendance Session</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new attendance session with QR code for students to scan
          </p>
        </div>
        <button
          onClick={() => router.push("/faculty/attendance/sessions")}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          View All Sessions →
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Courses Available</h3>
              <p className="mt-2 text-sm text-yellow-700">
                You need to be assigned to at least one course before creating attendance sessions.
                Please contact your HOD to get assigned to courses.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <AttendanceSessionForm courses={courses} onSubmit={handleSubmit} loading={loading} />
      )}

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          router.push("/faculty/attendance/sessions");
        }}
        sessionCode={sessionCode}
        courseName={courseName}
      />
    </div>
  );
}

