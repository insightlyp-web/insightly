// app/admin/posts/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import apiClient from "@/lib/axios";

interface Post {
  title: string;
  company: string;
  job_type: string;
  package: string;
  required_skills: string[];
  deadline: string;
  description: string;
  active?: boolean;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (data: Post) => {
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/admin/placement/posts", data);
      router.push("/admin/posts");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Placement Post</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new job or internship posting
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <PostForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}

