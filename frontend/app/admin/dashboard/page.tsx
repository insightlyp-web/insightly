// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";
import Link from "next/link";

interface OverviewData {
  total_posts: number;
  total_applications: number;
  status_breakdown: Array<{ status: string; count: number }>;
}

interface Post {
  id: string;
  title: string;
  company: string;
  job_type: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const [overviewRes, postsRes] = await Promise.all([
          apiClient.get("/admin/analytics/overview"),
          apiClient.get("/admin/placement/posts?active=1"),
        ]);

        setOverview(overviewRes.data);
        setRecentPosts(postsRes.data.posts?.slice(0, 5) || []);
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of placement posts and applications
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Posts"
          value={overview?.total_posts || 0}
          description="All placement posts"
          icon={<span className="text-2xl">📝</span>}
        />
        <StatCard
          title="Total Applications"
          value={overview?.total_applications || 0}
          description="All student applications"
          icon={<span className="text-2xl">📋</span>}
        />
        {overview?.status_breakdown?.slice(0, 2).map((item) => (
          <StatCard
            key={item.status}
            title={item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ")}
            value={item.count}
            description={`Applications with ${item.status} status`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
            <Link
              href="/admin/posts"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-gray-500">No recent posts</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-500">{post.company}</p>
                  </div>
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/posts/create"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 text-center"
            >
              Create New Post
            </Link>
            <Link
              href="/admin/analytics/overview"
              className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
            >
              View Analytics
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

