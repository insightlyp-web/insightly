// components/admin/PostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../hod/Card";

interface Post {
  id?: string;
  title: string;
  company: string;
  job_type: string;
  package: string;
  required_skills: string[];
  deadline: string;
  description: string;
  active?: boolean;
}

interface PostFormProps {
  initialValues?: Post;
  onSubmit: (data: Post) => Promise<void>;
  loading?: boolean;
}

export function PostForm({ initialValues, onSubmit, loading }: PostFormProps) {
  const [formData, setFormData] = useState<Post>({
    title: "",
    company: "",
    job_type: "fulltime",
    package: "",
    required_skills: [],
    deadline: "",
    description: "",
    active: true,
  });

  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
      setSkillsInput(initialValues.required_skills?.join(", ") || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await onSubmit({
      ...formData,
      required_skills: skills,
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            type="text"
            id="company"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="job_type" className="block text-sm font-medium text-gray-700">
              Job Type *
            </label>
            <select
              id="job_type"
              required
              value={formData.job_type}
              onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="fulltime">Full Time</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label htmlFor="package" className="block text-sm font-medium text-gray-700">
              Package *
            </label>
            <input
              type="text"
              id="package"
              required
              value={formData.package}
              onChange={(e) => setFormData({ ...formData, package: e.target.value })}
              placeholder="e.g., 10 LPA, 30k/month"
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
            Deadline *
          </label>
          <input
            type="datetime-local"
            id="deadline"
            required
            value={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 16) : ""}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
            Required Skills (comma-separated)
          </label>
          <input
            type="text"
            id="skills"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g., JavaScript, React, Node.js"
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple skills with commas
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={loading}
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Active (visible to students)
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Saving..." : initialValues ? "Update Post" : "Create Post"}
          </button>
        </div>
      </form>
    </Card>
  );
}

