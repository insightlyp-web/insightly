// app/student/resume/page.tsx
"use client";

import { useState, useRef } from "react";
import apiClient from "@/lib/axios";
import { Card } from "@/components/student/Card";

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  projects: string[];
  education: string[];
  experience: string[];
  summary: string;
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setSaveSuccess(false);

      const formData = new FormData();
      formData.append("resume", file);

      const response = await apiClient.post("/student/ai/resume/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setParsedData(response.data.data);
      setSuccess(true);
    } catch (err: any) {
      console.error("Resume analyze error:", err);
      setError(err.response?.data?.message || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const formData = new FormData();
      formData.append("resume", file);

      await apiClient.post("/student/ai/resume/save", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSaveSuccess(true);
    } catch (err: any) {
      console.error("Resume save error:", err);
      setError(err.response?.data?.message || "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload your resume to extract skills and information using AI
        </p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Resume (PDF)
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Resume analyzed successfully! Your skills have been updated.
              </p>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Resume saved successfully!
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
            <button
              onClick={handleSave}
              disabled={!file || saving}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Resume"}
            </button>
          </div>
        </div>
      </Card>

      {parsedData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="space-y-3">
              {parsedData.name && (
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {parsedData.name}
                  </p>
                </div>
              )}
              {parsedData.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {parsedData.email}
                  </p>
                </div>
              )}
              {parsedData.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {parsedData.phone}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Skills ({parsedData.skills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {parsedData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Summary */}
          {parsedData.summary && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Summary
              </h3>
              <p className="text-sm text-gray-700">{parsedData.summary}</p>
            </Card>
          )}

          {/* Projects */}
          {parsedData.projects.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Projects ({parsedData.projects.length})
              </h3>
              <div className="space-y-2">
                {parsedData.projects.map((project, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 border-l-2 border-indigo-500 pl-3"
                  >
                    {project}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Education */}
          {parsedData.education.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Education
              </h3>
              <div className="space-y-2">
                {parsedData.education.map((edu, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 border-l-2 border-indigo-500 pl-3"
                  >
                    {edu}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Experience */}
          {parsedData.experience.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Experience
              </h3>
              <div className="space-y-2">
                {parsedData.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 border-l-2 border-indigo-500 pl-3"
                  >
                    {exp}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

