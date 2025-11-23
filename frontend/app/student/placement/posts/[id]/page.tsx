// app/student/placement/posts/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/student/Card";
import { AISkillGap } from "@/components/student/AISkillGap";
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

export default function PlacementPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<PlacementPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      // Get all posts and find the one with matching ID
      const response = await apiClient.get("/student/placement/posts");
      const posts = response.data.posts || [];
      const foundPost = posts.find((p: PlacementPost) => p.id === postId);
      setPost(foundPost || null);
    } catch (error: any) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setMessage(null);

      await apiClient.post("/student/placement/apply", {
        post_id: postId,
        resume_url: "", // TODO: Add resume upload functionality
      });

      setMessage({
        type: "success",
        text: "Application submitted successfully!",
      });

      setTimeout(() => {
        router.push("/student/placement/applications");
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit application",
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  const isDeadlinePassed = post.deadline ? new Date(post.deadline) < new Date() : false;
  const jobTypeLabel = post.job_type === "internship" ? "Internship" : "Full Time";
  const jobTypeColor = post.job_type === "internship" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back to Posts
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{post.company_name}</p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
            {post.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
              </div>
            ) : (
              <p className="text-gray-500">No description provided</p>
            )}
          </Card>

          {post.required_skills && post.required_skills.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {post.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* AI Skill Gap Analysis */}
          <div className="mt-6">
            <AISkillGap postId={postId} postTitle={post.title} />
          </div>
        </div>

        <div>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm font-medium text-gray-900">{post.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Job Type</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColor}`}>
                  {jobTypeLabel}
                </span>
              </div>
              {post.package && (
                <div>
                  <p className="text-xs text-gray-500">Package</p>
                  <p className="text-sm font-medium text-gray-900">{post.package}</p>
                </div>
              )}
              {post.deadline && (
                <div>
                  <p className="text-xs text-gray-500">Application Deadline</p>
                  <p className={`text-sm font-medium ${isDeadlinePassed ? "text-red-600" : "text-gray-900"}`}>
                    {new Date(post.deadline).toLocaleDateString()}
                    {isDeadlinePassed && " (Passed)"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Posted</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={applying || isDeadlinePassed}
              className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? "Applying..." : isDeadlinePassed ? "Deadline Passed" : "Apply Now"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

