// components/hod/AISkillGap.tsx
"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import apiClient from "@/lib/axios";
import { Card } from "@/components/hod/Card";

interface SkillGapData {
  post_id: string;
  post_title: string;
  company_name: string;
  required_skills: string[];
  average_match_percentage: number;
  students_analyzed: number;
}

export function AISkillGap() {
  const [skillGapData, setSkillGapData] = useState<SkillGapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkillGap();
  }, []);

  const fetchSkillGap = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/hod/ai/skills/gap");
      setSkillGapData(response.data.skill_gap_distribution || []);
      // Show message if ML service is unavailable
      if (response.data.message && response.data.skill_gap_distribution?.length === 0) {
        setError(response.data.message);
      }
    } catch (err: any) {
      console.error("Failed to fetch skill gap data:", err);
      // Don't show error for connection refused - ML service might be down
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ECONNREFUSED')) {
        setError("ML service is currently unavailable. Please ensure the ML service is running on port 8000.");
      } else {
        setError(err.response?.data?.message || "Failed to load skill gap analysis");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/icons_hod/AI Skill.png" alt="AI Skill Gap" width={24} height={24} />
          AI Skill Gap Distribution
        </h3>
        <div className="text-center py-8">
          <Spinner size={32} className="text-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Analyzing skill gaps...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/icons_hod/AI Skill.png" alt="AI Skill Gap" width={24} height={24} />
          AI Skill Gap Distribution
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (skillGapData.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/icons_hod/AI Skill.png" alt="AI Skill Gap" width={24} height={24} />
          AI Skill Gap Distribution
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No placement posts available for skill gap analysis.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Image src="/icons_hod/AI Skill.png" alt="AI Skill Gap" width={24} height={24} />
        AI Skill Gap Distribution
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Average skill match percentage for department students across active placement posts
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Post
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Match %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students Analyzed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {skillGapData.slice(0, 10).map((item) => (
              <tr key={item.post_id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.post_title}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.company_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.average_match_percentage >= 70
                            ? "bg-green-500"
                            : item.average_match_percentage >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${item.average_match_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.average_match_percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.students_analyzed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {skillGapData.length > 10 && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Showing top 10 of {skillGapData.length} posts
        </p>
      )}
    </Card>
  );
}

