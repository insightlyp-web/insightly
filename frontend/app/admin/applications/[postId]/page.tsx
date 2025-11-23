// app/admin/applications/[postId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  department: string;
  status: string;
  admin_feedback?: string;
  applied_at: string;
}

interface Post {
  id: string;
  title: string;
  company: string;
}

export default function ApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const [applications, setApplications] = useState<Application[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const [appsRes, postRes] = await Promise.all([
          apiClient.get(`/admin/applications/post/${postId}`),
          apiClient.get(`/admin/placement/posts/${postId}`).catch(() => ({ data: { post: null } })),
        ]);

        setApplications(appsRes.data.applications || []);
        setPost(postRes.data.post);
      } catch (error: any) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const handleStatusUpdate = async (id: string, status: string, feedback: string) => {
    try {
      await apiClient.patch(`/admin/applications/${id}/status`, {
        status,
        admin_feedback: feedback,
      });

      // Refresh applications list
      const response = await apiClient.get(`/admin/applications/post/${postId}`);
      setApplications(response.data.applications || []);
    } catch (error: any) {
      console.error("Failed to update application status:", error);
      alert(error.response?.data?.message || "Failed to update status");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Applications
            {post && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                - {post.title} ({post.company})
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student applications for this post
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Posts
        </Link>
      </div>

      <Card>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total Applications: <span className="font-semibold">{applications.length}</span>
          </p>
        </div>
      </Card>

      <ApplicationsTable
        applications={applications}
        onStatusUpdate={handleStatusUpdate}
        loading={loading}
      />
    </div>
  );
}

