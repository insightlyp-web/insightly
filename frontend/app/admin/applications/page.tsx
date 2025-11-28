// app/admin/applications/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Application {
  id: string;
  post_id: string;
  student_name: string;
  student_email: string;
  student_department: string;
  status: string;
  admin_feedback?: string;
  applied_at: string;
  post_title?: string;
  company_name?: string;
}

export default function AllApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAllApplications();
  }, []);

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/applications");
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error("Failed to fetch applications:", error);
      setUpdateMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch applications",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, feedback: string) => {
    try {
      await apiClient.patch(`/admin/applications/${id}/status`, {
        status,
        admin_feedback: feedback,
      });

      // Refresh applications list
      await fetchAllApplications();
      
      // Show success message
      setUpdateMessage({ type: "success", text: "Application status updated successfully" });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to update application status:", error);
      setUpdateMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update status" 
      });
      setTimeout(() => setUpdateMessage(null), 5000);
      throw error;
    }
  };

  // Filter applications by post if selected
  const filteredApplications = selectedPostId
    ? applications.filter(app => app.post_id === selectedPostId)
    : applications;

  const columns = [
    { header: "Student", accessor: "student_name" },
    { header: "Email", accessor: "student_email" },
    { header: "Department", accessor: "student_department" },
    { header: "Post", accessor: "post_title", render: (value: string, row: Application) => (
      <Link 
        href={`/admin/posts/${row.post_id}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {value || "Unknown"}
      </Link>
    )},
    { header: "Company", accessor: "company_name" },
    { header: "Status", accessor: "status", render: (value: string) => {
      const colors: Record<string, string> = {
        applied: "bg-gray-100 text-gray-800",
        mentor_approved: "bg-blue-100 text-blue-800",
        mentor_rejected: "bg-red-100 text-red-800",
        shortlisted: "bg-green-100 text-green-800",
        not_shortlisted: "bg-yellow-100 text-yellow-800",
        selected: "bg-purple-100 text-purple-800",
        rejected: "bg-red-100 text-red-800",
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[value] || "bg-gray-100 text-gray-800"}`}>
          {value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      );
    }},
    { header: "Applied At", accessor: "applied_at", render: (value: string) => new Date(value).toLocaleDateString() },
    { header: "Actions", accessor: "id", render: (value: string, row: Application) => (
      <Link
        href={`/admin/applications/${row.post_id}`}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View Details
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all student applications across all placement posts
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Posts
        </Link>
      </div>

      {updateMessage && (
        <div
          className={`rounded-md p-4 ${
            updateMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {updateMessage.text}
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Total Applications: <span className="font-semibold">{filteredApplications.length}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Click "View Details" to see full application and update status
            </p>
          </div>
        </div>
      </Card>

      <Table columns={columns} data={filteredApplications} loading={loading} />
    </div>
  );
}

