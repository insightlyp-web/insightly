// components/student/AIRecommendedPlacements.tsx
"use client";

import { useEffect, useState } from "react";
import { PlacementCard } from "./PlacementCard";
import apiClient from "@/lib/axios";
import Link from "next/link";

interface RecommendedPlacement {
  id: string;
  title: string;
  company_name: string;
  job_type: string;
  package?: string;
  deadline?: string;
  recommendation_score: number;
  matched_skills_count: number;
  total_required_skills: number;
}

export function AIRecommendedPlacements() {
  const [recommendations, setRecommendations] = useState<RecommendedPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/ai/placement/recommended");
      setRecommendations(response.data.recommendations || []);
    } catch (err: any) {
      console.error("Failed to fetch recommendations:", err);
      setError(err.response?.data?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🤖 AI Recommended for You
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Analyzing your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🤖 AI Recommended for You
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-2">
            Upload your resume to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🤖 AI Recommended for You
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No recommendations available. Upload your resume to get personalized job recommendations.
          </p>
          <Link
            href="/student/placement"
            className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800"
          >
            Go to Placements →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🤖 AI Recommended for You
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Based on your skills and profile, here are the best matches for you
      </p>
      <div className="space-y-4">
        {recommendations.slice(0, 5).map((placement) => (
          <div key={placement.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{placement.title}</h4>
                <p className="text-sm text-gray-600">{placement.company_name}</p>
              </div>
              <div className="ml-4 text-right">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {Math.round(placement.recommendation_score * 100)}% Match
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <span>
                {placement.matched_skills_count} of {placement.total_required_skills} skills match
              </span>
            </div>
            <Link
              href={`/student/placement/${placement.id}`}
              className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
      <Link
        href="/student/placement"
        className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        View All Placements →
      </Link>
    </div>
  );
}

