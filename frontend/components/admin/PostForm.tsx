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
  eligible_departments?: string[];
  min_gpa?: number;
  min_year?: number;
  max_year?: number;
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
    eligible_departments: [],
    min_gpa: undefined,
    min_year: undefined,
    max_year: undefined,
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [departmentsInput, setDepartmentsInput] = useState("");

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
      setSkillsInput(initialValues.required_skills?.join(", ") || "");
      setDepartmentsInput(initialValues.eligible_departments?.join(", ") || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const departments = departmentsInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    await onSubmit({
      ...formData,
      required_skills: skills,
      eligible_departments: departments.length > 0 ? departments : undefined,
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

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Criteria</h3>
          
          <div>
            <label htmlFor="departments" className="block text-sm font-medium text-gray-700">
              Eligible Departments (comma-separated, leave empty for all)
            </label>
            <input
              type="text"
              id="departments"
              value={departmentsInput}
              onChange={(e) => setDepartmentsInput(e.target.value)}
              placeholder="e.g., CS, ECE, Civil"
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to allow all departments
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="min_gpa" className="block text-sm font-medium text-gray-700">
                Minimum GPA
              </label>
              <input
                type="number"
                id="min_gpa"
                min="0"
                max="10"
                step="0.01"
                value={formData.min_gpa || ""}
                onChange={(e) => setFormData({ ...formData, min_gpa: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g., 7.5"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="min_year" className="block text-sm font-medium text-gray-700">
                Minimum Year
              </label>
              <select
                id="min_year"
                value={formData.min_year || ""}
                onChange={(e) => setFormData({ ...formData, min_year: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Any</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_year" className="block text-sm font-medium text-gray-700">
                Maximum Year
              </label>
              <select
                id="max_year"
                value={formData.max_year || ""}
                onChange={(e) => setFormData({ ...formData, max_year: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Any</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>
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

