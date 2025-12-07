// app/hod/students/page.tsx
"use client";

import { useEffect, useState } from "react";
import { UploadCard } from "@/components/hod/UploadCard";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  academic_year?: string;
  student_year?: string;
  roll_number?: string;
  resume_url?: string;
  created_at: string;
  subject_count?: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ studentId: string; studentName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/hod/students");
      setStudents(response.data.students || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch students",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/hod/students/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: `Successfully uploaded ${response.data.inserted || 0} students`,
      });

      // Refresh the list
      await fetchStudents();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload students",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (studentId: string, file: File) => {
    if (file.type !== "application/pdf") {
      setMessage({
        type: "error",
        text: "Please upload a PDF file",
      });
      return;
    }

    try {
      setUploadingResume(studentId);
      setMessage(null);

      const formData = new FormData();
      formData.append("resume", file);

      await apiClient.post(`/hod/students/${studentId}/resume`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: "Resume uploaded successfully",
      });

      // Refresh the list
      await fetchStudents();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload resume",
      });
    } finally {
      setUploadingResume(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/hod/students/${deleteConfirm.studentId}`);

      setMessage({
        type: "success",
        text: `Student "${deleteConfirm.studentName}" deleted successfully`,
      });

      setDeleteConfirm(null);
      await fetchStudents();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete student",
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { header: "Roll Number", accessor: "roll_number", render: (value: string) => value || "-" },
    { header: "Name", accessor: "full_name", render: (value: string) => <span className="truncate overflow-hidden text-ellipsis max-w-[180px] block" title={value}>{value}</span> },
    { header: "Academic Year", accessor: "academic_year", render: (value: string) => value || "-" },
    { header: "Year", accessor: "student_year", render: (value: string) => value || "-" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone", render: (value: string) => value || "-" },
    { header: "Subjects", accessor: "subject_count", render: (value: number) => value ? value.toString() : "0" },
    {
      header: "Resume",
      accessor: "resume_url",
      render: (value: string, row: Student) => {
        const fileInputId = `resume-${row.id}`;
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <span className="text-xs text-green-600">✓ Uploaded</span>
            ) : (
              <span className="text-xs text-gray-400">Not uploaded</span>
            )}
            <label
              htmlFor={fileInputId}
              className={`text-xs px-2 py-1 rounded cursor-pointer ${
                uploadingResume === row.id
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {uploadingResume === row.id ? "Uploading..." : "Upload"}
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={uploadingResume === row.id}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleResumeUpload(row.id, e.target.files[0]);
                  e.target.value = ""; // Reset input
                }
              }}
            />
          </div>
        );
      },
    },
    {
      header: "Created",
      accessor: "created_at",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string, row: Student) => (
        <button
          onClick={() => setDeleteConfirm({ studentId: value, studentName: row.full_name })}
          className="text-red-600 hover:text-red-800 transition-colors"
          title="Delete student"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage department students
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

      <UploadCard
        title="Upload Students"
        description="Upload a CSV or Excel file with student data. Required columns: full_name, email. Optional: phone, academic_year (e.g., 2025-26), student_year (I/II/III/IV), roll_number"
        onUpload={handleUpload}
        loading={uploading}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Department Students ({students.length})
        </h2>
        <Table columns={columns} data={students} loading={loading} />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Student</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.studentName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

