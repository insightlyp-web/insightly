// components/admin/ApplicationsTable.tsx
"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "../hod/Card";
import { StatusBadge } from "./StatusBadge";

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  department: string;
  status: string;
  admin_feedback?: string;
  applied_at: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onStatusUpdate: (id: string, status: string, feedback: string) => Promise<void>;
  loading?: boolean;
}

export function ApplicationsTable({
  applications,
  onStatusUpdate,
  loading,
}: ApplicationsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleEdit = (app: Application) => {
    setEditingId(app.id);
    setStatus(app.status);
    setFeedback(app.admin_feedback || "");
  };

  const handleSave = async (id: string) => {
    await onStatusUpdate(id, status, feedback);
    setEditingId(null);
    setStatus("");
    setFeedback("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setStatus("");
    setFeedback("");
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-6">
          <Spinner size={32} className="text-blue-600 mx-auto" />
          <p className="ml-3 text-gray-500">Loading applications...</p>
        </div>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          No applications found for this post.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {app.student_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {app.student_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {app.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === app.id ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                    >
                      <option value="applied">Applied</option>
                      <option value="mentor_approved">Mentor Approved</option>
                      <option value="mentor_rejected">Mentor Rejected</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="not_shortlisted">Not Shortlisted</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <StatusBadge status={app.status} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === app.id ? (
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                      placeholder="Add admin feedback..."
                    />
                  ) : (
                    <span className="truncate max-w-xs block">
                      {app.admin_feedback || "-"}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === app.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(app.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(app)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

