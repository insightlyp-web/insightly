// app/student/placement/applications/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Table } from "@/components/student/Table";
import apiClient from "@/lib/axios";

interface Application {
  id: string;
  post_id: string;
  title: string;
  company_name: string;
  status: string;
  applied_at: string;
  mentor_feedback?: string;
  admin_feedback?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "selected":
      return "bg-green-100 text-green-800";
    case "shortlisted":
      return "bg-blue-100 text-blue-800";
    case "rejected":
    case "not_shortlisted":
      return "bg-red-100 text-red-800";
    case "mentor_rejected":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/placement/applications");
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Company", accessor: "company_name" },
    { header: "Position", accessor: "title" },
    {
      header: "Status",
      accessor: "status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(value)}`}>
          {getStatusLabel(value)}
        </span>
      ),
    },
    {
      header: "Applied Date",
      accessor: "applied_at",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: "Feedback",
      accessor: "mentor_feedback",
      render: (value: string, row: Application) => {
        const feedback = row.admin_feedback || row.mentor_feedback || value;
        return feedback ? (
          <span className="text-xs text-gray-600" title={feedback}>
            {feedback.length > 50 ? feedback.substring(0, 50) + "..." : feedback}
          </span>
        ) : (
          "-"
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your placement applications
        </p>
      </div>

      <Table columns={columns} data={applications} loading={loading} />
    </div>
  );
}

