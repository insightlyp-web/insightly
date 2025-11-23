// app/faculty/marks/assessments/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssessmentForm } from "@/components/faculty/AssessmentForm";
import apiClient from "@/lib/axios";

interface Course {
  id: string;
  code: string;
  name: string;
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get("/faculty/courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch courses",
      });
    }
  };

  const handleSubmit = async (data: {
    course_id: string;
    title: string;
    type: string;
    max_marks: number;
    weightage: number;
    due_date: string;
  }) => {
    try {
      setLoading(true);
      setMessage(null);

      const payload = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      };

      await apiClient.post("/faculty/marks/assessments", payload);

      setMessage({
        type: "success",
        text: "Assessment created successfully!",
      });

      setTimeout(() => {
        router.push("/faculty/marks/assessments");
      }, 1500);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create assessment",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pre-select course if coming from course students page
  const preSelectedCourseId = searchParams.get("course_id");

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back to Assessments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Assessment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new assessment for your course
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <AssessmentForm
        courses={courses}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}

