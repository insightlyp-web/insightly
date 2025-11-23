// app/faculty/marks/assessments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface Assessment {
  id: string;
  title: string;
  type: string;
  course_code: string;
  course_name: string;
  max_marks: number;
  weightage: number;
  due_date: string;
  created_at: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/faculty/marks/assessments");
      setAssessments(response.data.assessments || []);
    } catch (error: any) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Type", accessor: "type", render: (value: string) => value.replace('_', ' ').toUpperCase() },
    { header: "Course", accessor: "course_code" },
    {
      header: "Max Marks",
      accessor: "max_marks",
      render: (value: number) => value || 0,
    },
    {
      header: "Weightage",
      accessor: "weightage",
      render: (value: number) => `${value}%`,
    },
    {
      header: "Due Date",
      accessor: "due_date",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      header: "Actions",
      accessor: "id",
      render: (value: string) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/faculty/marks/assessments/${value}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View/Add Marks
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your assessments and marks
          </p>
        </div>
        <button
          onClick={() => router.push("/faculty/marks/assessments/create")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Assessment
        </button>
      </div>

      <Table columns={columns} data={assessments} loading={loading} />
    </div>
  );
}

