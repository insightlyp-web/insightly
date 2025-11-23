// app/admin/posts/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PostForm } from "@/components/admin/PostForm";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";

interface Post {
  id: string;
  title: string;
  company: string;
  job_type: string;
  package: string;
  required_skills: string[];
  deadline: string;
  description: string;
  active: boolean;
  application_count?: number;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchPost = async () => {
      try {
        const response = await apiClient.get(`/admin/placement/posts/${postId}`);
        setPost(response.data.post);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSubmit = async (data: any) => {
    setSaving(true);
    setError("");

    try {
      await apiClient.put(`/admin/placement/posts/${postId}`, data);
      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update post");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await apiClient.delete(`/admin/placement/posts/${postId}`);
      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Post not found</p>
        <Link href="/admin/posts" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update placement post details
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/applications/${postId}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Applications ({post.application_count || 0})
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <PostForm initialValues={post} onSubmit={handleSubmit} loading={saving} />
    </div>
  );
}

