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
      setPosts(response.data.posts || []);
    } catch (error: any) {
      console.error("Failed to fetch placement posts:", error);
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
          <div className="text-center py-8">
            <p className="text-gray-500">No placement posts found</p>
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

