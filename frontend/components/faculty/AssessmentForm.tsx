// components/faculty/AssessmentForm.tsx
"use client";

import { useState } from "react";
import { Card } from "./Card";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface AssessmentFormProps {
  courses: Course[];
  onSubmit: (data: {
    course_id: string;
    title: string;
    type: string;
    max_marks: number;
    weightage: number;
    due_date: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function AssessmentForm({ courses, onSubmit, loading }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    type: "assignment",
    max_marks: 100,
    weightage: 10,
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Assessment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select
            required
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Mid-term Exam"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="internal_exam">Internal Exam</option>
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="lab">Lab</option>
            <option value="project">Project</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
            <input
              type="number"
              required
              min="1"
              value={formData.max_marks}
              onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              step="0.1"
              value={formData.weightage}
              onChange={(e) => setFormData({ ...formData, weightage: parseFloat(e.target.value) })}
              className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Assessment"}
        </button>
      </form>
    </Card>
  );
}

