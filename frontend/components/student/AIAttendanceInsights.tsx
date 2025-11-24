// components/student/AIAttendanceInsights.tsx
"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import apiClient from "@/lib/axios";

interface AttendanceAnomaly {
  pattern: string;
  anomaly_days: string[];
  confidence: number;
  attendance_rate: number;
  total_days: number;
  present_days: number;
  absent_days: number;
}

export function AIAttendanceInsights() {
  const [anomaly, setAnomaly] = useState<AttendanceAnomaly | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnomaly();
  }, []);

  const fetchAnomaly = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/ai/attendance/anomaly");
      setAnomaly(response.data);
    } catch (err: any) {
      console.error("Failed to fetch attendance insights:", err);
      setError(err.response?.data?.message || "Failed to analyze attendance");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/icons_student/AI Attendance Insights.png" alt="AI Attendance Insights" width={24} height={24} />
          AI Attendance Insights
        </h3>
        <div className="text-center py-8">
          <Spinner size={32} className="text-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Analyzing your attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/icons_student/AI Attendance Insights.png" alt="AI Attendance Insights" width={24} height={24} />
          AI Attendance Insights
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!anomaly) {
    return null;
  }

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case "regular":
        return "bg-green-100 text-green-800";
      case "mostly_regular":
        return "bg-blue-100 text-blue-800";
      case "inconsistent":
        return "bg-yellow-100 text-yellow-800";
      case "at-risk":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case "regular":
        return "Regular Attendance";
      case "mostly_regular":
        return "Mostly Regular";
      case "inconsistent":
        return "Inconsistent";
      case "at-risk":
        return "At Risk";
      default:
        return pattern;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Image src="/icons_student/AI Attendance Insights.png" alt="AI Attendance Insights" width={24} height={24} />
        AI Attendance Insights
      </h3>

      {/* Pattern Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPatternColor(
            anomaly.pattern
          )}`}
        >
          {getPatternLabel(anomaly.pattern)}
        </span>
        <span className="ml-2 text-xs text-gray-500">
          Confidence: {(anomaly.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Attendance Rate</p>
          <p className="text-lg font-semibold text-gray-900">
            {anomaly.attendance_rate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Present Days</p>
          <p className="text-lg font-semibold text-gray-900">
            {anomaly.present_days}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Absent Days</p>
          <p className="text-lg font-semibold text-gray-900">
            {anomaly.absent_days}
          </p>
        </div>
      </div>

      {/* Anomaly Days */}
      {anomaly.anomaly_days.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Anomaly Days ({anomaly.anomaly_days.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {anomaly.anomaly_days.slice(0, 10).map((day, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
              >
                {new Date(day).toLocaleDateString()}
              </span>
            ))}
            {anomaly.anomaly_days.length > 10 && (
              <span className="text-xs text-gray-500">
                +{anomaly.anomaly_days.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {anomaly.pattern === "at-risk" && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-1">
            ⚠️ Attention Required
          </p>
          <p className="text-xs text-red-700">
            Your attendance pattern shows signs of risk. Please contact your faculty or HOD for support.
          </p>
        </div>
      )}
    </div>
  );
}

