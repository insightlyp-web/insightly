// app/admin/posts/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PostTable } from "@/components/admin/PostTable";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";

interface Post {
  id: string;
  title: string;
  company: string;
  job_type: string;
  package: string;
  deadline: string;
  created_at: string;
  active: boolean;
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company: "",
    type: "",
    active: false,
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.company) params.append("company", filters.company);
      if (filters.type) params.append("type", filters.type);
      if (filters.active) params.append("active", "1");

      const response = await apiClient.get(
        `/admin/placement/posts?${params.toString()}`
      );
      setPosts(response.data.posts || []);
    } catch (error: any) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    hasFetched.current = false;
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/placement/posts/${id}`);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error("Failed to delete post:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Posts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all placement posts
          </p>
        </div>
        <Link
          href="/admin/posts/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Post
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={filters.company}
              onChange={(e) => handleFilterChange("company", e.target.value)}
              placeholder="Filter by company"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="fulltime">Full Time</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.active}
                onChange={(e) => handleFilterChange("active", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Only active</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Card>

      <PostTable posts={posts} onDelete={handleDelete} loading={loading} />
    </div>
  );
}

