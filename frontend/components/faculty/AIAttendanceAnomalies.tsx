// components/faculty/AIAttendanceAnomalies.tsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card } from "@/components/faculty/Card";

interface AttendanceAnomaly {
  student_id: string;
  student_name: string;
  student_email: string;
  pattern: string;
  anomaly_days: string[];
  confidence: number;
  attendance_rate: number;
}

interface AIAttendanceAnomaliesProps {
  courseId: string;
}

export function AIAttendanceAnomalies({ courseId }: AIAttendanceAnomaliesProps) {
  const [anomalies, setAnomalies] = useState<AttendanceAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchAnomalies();
    }
  }, [courseId]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/faculty/ai/attendance/anomaly?course_id=${courseId}`);
      setAnomalies(response.data.anomalies || []);
    } catch (err: any) {
      console.error("Failed to fetch anomalies:", err);
      setError(err.response?.data?.message || "Failed to load attendance anomalies");
    } finally {
      setLoading(false);
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case "at-risk":
        return "bg-red-100 text-red-800";
      case "inconsistent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 AI Attendance Anomalies
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Analyzing attendance patterns...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 AI Attendance Anomalies
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (anomalies.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 AI Attendance Anomalies
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No attendance anomalies detected. All students have regular attendance patterns.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔍 AI Attendance Anomalies ({anomalies.length})
      </h3>
      <div className="space-y-4">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.student_id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{anomaly.student_name}</h4>
                <p className="text-sm text-gray-600">{anomaly.student_email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPatternColor(
                  anomaly.pattern
                )}`}
              >
                {anomaly.pattern.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Attendance Rate: {anomaly.attendance_rate.toFixed(1)}%</p>
              <p>Anomaly Days: {anomaly.anomaly_days.length}</p>
              <p>Confidence: {(anomaly.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

