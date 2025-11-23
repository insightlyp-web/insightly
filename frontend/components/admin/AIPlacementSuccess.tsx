// components/admin/AIPlacementSuccess.tsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card } from "@/components/admin/StatCard";

interface PlacementPrediction {
  student_id: string;
  student_name: string;
  department: string;
  student_year: string;
  success_probability: number;
  application_count: number;
  skills_count: number;
  attendance_percentage: number;
  average_marks: number;
}

export function AIPlacementSuccess() {
  const [predictions, setPredictions] = useState<PlacementPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/ai/placement/success");
      setPredictions(response.data.predictions || []);
    } catch (err: any) {
      console.error("Failed to fetch predictions:", err);
      setError(err.response?.data?.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 AI Placement Success Predictions
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
          📊 AI Placement Success Predictions
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 AI Placement Success Predictions
      </h3>
      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No predictions available</p>
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
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Probability
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.slice(0, 20).map((prediction) => (
                <tr key={prediction.student_id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prediction.student_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.department}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            prediction.success_probability >= 70
                              ? "bg-green-500"
                              : prediction.success_probability >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${prediction.success_probability}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {prediction.success_probability}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.application_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.skills_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.attendance_percentage.toFixed(1)}%
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

