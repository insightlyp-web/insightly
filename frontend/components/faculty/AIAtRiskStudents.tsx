// components/faculty/AIAtRiskStudents.tsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card } from "@/components/faculty/Card";

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  risk_level: string;
  risk_score: number;
  risk_factors: string[];
  recommendations: string[];
  attendance_percentage: number;
}

interface AIAtRiskStudentsProps {
  courseId: string;
}

export function AIAtRiskStudents({ courseId }: AIAtRiskStudentsProps) {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchAtRiskStudents();
    }
  }, [courseId]);

  const fetchAtRiskStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/faculty/ai/students/at-risk?course_id=${courseId}`);
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
          ⚠️ AI At-Risk Students
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
          ⚠️ AI At-Risk Students
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ AI At-Risk Students
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No at-risk students detected. All students are performing well!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ⚠️ AI At-Risk Students ({students.length})
      </h3>
      <div className="space-y-4">
        {students.map((student) => (
          <div
            key={student.student_id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{student.student_name}</h4>
                <p className="text-sm text-gray-600">{student.student_email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(
                  student.risk_level
                )}`}
              >
                {student.risk_level.toUpperCase()} RISK
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Attendance: {student.attendance_percentage.toFixed(1)}%</p>
              <p>Risk Score: {student.risk_score}</p>
            </div>
            {student.risk_factors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Risk Factors:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside">
                  {student.risk_factors.slice(0, 3).map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

