// components/hod/AIAtRiskStudents.tsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card } from "@/components/hod/Card";

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  student_year: string;
  academic_year: string;
  section: string;
  risk_level: string;
  risk_score: number;
  risk_factors: string[];
  recommendations: string[];
  attendance_percentage: number;
}

export function AIAtRiskStudents() {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  useEffect(() => {
    fetchAtRiskStudents();
  }, []);

  const fetchAtRiskStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/hod/ai/risk");
      setStudents(response.data.at_risk_students || []);
    } catch (err: any) {
      console.error("Failed to fetch at-risk students:", err);
      setError(err.response?.data?.message || "Failed to load at-risk students");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Students At Risk ({students.length})
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Analyzing student data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Students At Risk
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </Card>
    );
  }

  const filteredStudents = filter === "all" 
    ? students 
    : students.filter(s => s.risk_level === filter);

  const highRiskCount = students.filter(s => s.risk_level === "high").length;
  const mediumRiskCount = students.filter(s => s.risk_level === "medium").length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ⚠️ Students At Risk ({filteredStudents.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setFilter("high")}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === "high"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            High ({highRiskCount})
          </button>
          <button
            onClick={() => setFilter("medium")}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === "medium"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Medium ({mediumRiskCount})
          </button>
        </div>
      </div>
      {filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No at-risk students detected. All students are performing well!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year/Section
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.student_name}
                      </div>
                      <div className="text-sm text-gray-500">{student.student_email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {student.student_year} / {student.section}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(
                        student.risk_level
                      )}`}
                    >
                      {student.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {student.attendance_percentage !== null && student.attendance_percentage !== undefined
                      ? `${student.attendance_percentage.toFixed(1)}%`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {student.risk_factors.slice(0, 2).join(", ")}
                    {student.risk_factors.length > 2 && "..."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

