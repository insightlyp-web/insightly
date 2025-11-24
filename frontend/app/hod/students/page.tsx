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
  section?: string;
  roll_number?: string;
  resume_url?: string;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const columns = [
    { header: "Roll Number", accessor: "roll_number", render: (value: string) => value || "-" },
    { header: "Name", accessor: "full_name" },
    { header: "Academic Year", accessor: "academic_year", render: (value: string) => value || "-" },
    { header: "Year", accessor: "student_year", render: (value: string) => value || "-" },
    { header: "Section", accessor: "section", render: (value: string) => value || "-" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone", render: (value: string) => value || "-" },
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
        description="Upload a CSV or Excel file with student data. Required columns: full_name, email. Optional: phone, academic_year (e.g., 2025-26), student_year (I/II/III/IV), section (A/B/C/D), roll_number"
        onUpload={handleUpload}
        loading={uploading}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Department Students ({students.length})
        </h2>
        <Table columns={columns} data={students} loading={loading} />
      </div>
    </div>
  );
}

