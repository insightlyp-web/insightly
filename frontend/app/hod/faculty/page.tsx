// app/hod/faculty/page.tsx
"use client";

import { useEffect, useState } from "react";
import { UploadCard } from "@/components/hod/UploadCard";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Faculty {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/hod/faculty");
      setFaculty(response.data.faculty || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch faculty",
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

      const response = await apiClient.post("/hod/faculty/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: `Successfully uploaded ${response.data.inserted || 0} faculty members`,
      });

      await fetchFaculty();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload faculty",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (facultyId: string, facultyName: string) => {
    if (!confirm(`Are you sure you want to delete ${facultyName}? This will unassign them from all courses.`)) {
      return;
    }

    try {
      setMessage(null);
      const response = await apiClient.delete(`/hod/faculty/${facultyId}`);
      
      setMessage({
        type: "success",
        text: response.data.message || "Faculty deleted successfully",
      });

      await fetchFaculty();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete faculty",
      });
    }
  };

  const columns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    {
      header: "Created",
      accessor: "created_at",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string, row: Faculty) => (
        <button
          onClick={() => handleDelete(value, row.full_name)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage department faculty
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
        title="Upload Faculty"
        description="Upload a CSV or Excel file with faculty data (columns: full_name, email, phone)"
        onUpload={handleUpload}
        loading={uploading}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Department Faculty ({faculty.length})
        </h2>
        <Table columns={columns} data={faculty} loading={loading} />
      </div>
    </div>
  );
}

