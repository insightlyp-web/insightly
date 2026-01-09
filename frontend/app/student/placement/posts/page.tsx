// app/student/placement/posts/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { PlacementCard } from "@/components/student/PlacementCard";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

interface PlacementPost {
  id: string;
  title: string;
  company_name: string;
  job_type: string;
  package?: string;
  deadline?: string;
  description?: string;
  required_skills?: string[];
  created_at: string;
}

export default function PlacementPostsPage() {
  const [posts, setPosts] = useState<PlacementPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company: "",
    type: "",
    active: "1",
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchPosts();
  }, []);

  useEffect(() => {
    // Refetch when filters change
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.company) params.append("company", filters.company);
      if (filters.type) params.append("type", filters.type);
      if (filters.active) params.append("active", filters.active);

      const response = await apiClient.get(`/student/placement/posts?${params.toString()}`);
      console.log("Placement posts response:", response.data);
      setPosts(response.data.posts || []);
      
      if (!response.data.posts || response.data.posts.length === 0) {
        console.warn("No placement posts returned. Check backend logs for filtering reasons.");
      }
    } catch (error: any) {
      console.error("Failed to fetch placement posts:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size={32} className="text-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Placement Opportunities</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and apply for placement opportunities
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company</label>
            <input
              type="text"
              value={filters.company}
              onChange={(e) => handleFilterChange("company", e.target.value)}
              placeholder="Search company..."
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Job Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="internship">Internship</option>
              <option value="fulltime">Full Time</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange("active", e.target.value)}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="1">Active Only</option>
              <option value="0">All Posts</option>
            </select>
          </div>
        </div>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No placement posts available</h3>
            <p className="text-sm text-gray-500 mb-4">
              There are currently no placement opportunities matching your profile.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Try changing the filters above</p>
              <p>• Check if posts are set to "Active Only"</p>
              <p>• Contact admin if you believe posts should be visible</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PlacementCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

