// components/student/AISkillGap.tsx
"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";

interface SkillGapData {
  missing: string[];
  strengths: string[];
  match_percentage: number;
}

interface AISkillGapProps {
  postId: string;
  postTitle?: string;
}

export function AISkillGap({ postId, postTitle }: AISkillGapProps) {
  const [skillGap, setSkillGap] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      fetchSkillGap();
    }
  }, [postId]);

  const fetchSkillGap = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/student/ai/skills/gap?post_id=${postId}`);
      setSkillGap(response.data);
    } catch (err: any) {
      console.error("Failed to fetch skill gap:", err);
      setError(err.response?.data?.message || "Failed to analyze skill gap");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 AI Skill Gap Analysis
        </h3>
        <div className="text-center py-8">
          <Spinner size={32} className="text-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Analyzing your skills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 AI Skill Gap Analysis
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-2">
            Upload your resume to enable skill gap analysis
          </p>
        </div>
      </div>
    );
  }

  if (!skillGap) {
    return null;
  }

  const matchColor =
    skillGap.match_percentage >= 70
      ? "bg-green-500"
      : skillGap.match_percentage >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 AI Skill Gap Analysis
      </h3>
      {postTitle && (
        <p className="text-sm text-gray-600 mb-4">For: {postTitle}</p>
      )}

      {/* Match Percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Match Score</span>
          <span className="text-sm font-semibold text-gray-900">
            {skillGap.match_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${matchColor} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${skillGap.match_percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Missing Skills */}
      {skillGap.missing.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Missing Skills ({skillGap.missing.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {skillGap.missing.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {skillGap.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Your Strengths ({skillGap.strengths.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {skillGap.strengths.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {skillGap.missing.length === 0 && skillGap.strengths.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No skill data available. Upload your resume to see analysis.
        </p>
      )}
    </div>
  );
}

