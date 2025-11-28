// app/student/placement/applications/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/hod/Card";
import apiClient from "@/lib/axios";

interface StatusHistory {
  from_status: string;
  to_status: string;
  changed_at: string;
  changed_by_name: string;
  feedback?: string;
}

interface Application {
  id: string;
  post_id: string;
  title: string;
  company_name: string;
  status: string;
  applied_at: string;
  mentor_feedback?: string;
  admin_feedback?: string;
  status_history?: StatusHistory[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "selected":
      return "bg-green-100 text-green-800 border-green-300";
    case "shortlisted":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "rejected":
    case "not_shortlisted":
      return "bg-red-100 text-red-800 border-red-300";
    case "mentor_rejected":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "mentor_approved":
      return "bg-purple-100 text-purple-800 border-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const statusOrder = {
  applied: 1,
  mentor_approved: 2,
  mentor_rejected: 3,
  shortlisted: 4,
  not_shortlisted: 5,
  selected: 6,
  rejected: 7,
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/student/placement/applications/${applicationId}`);
      setApplication(response.data.application || null);
    } catch (error: any) {
      console.error("Failed to fetch application:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Application not found</p>
        <button
          onClick={() => router.push("/student/placement/applications")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const statusHistory = application.status_history || [];
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  // Create status timeline
  const allStatuses = ["applied", ...sortedHistory.map(h => h.to_status)];
  const uniqueStatuses = Array.from(new Set(allStatuses));

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Application Status</h1>
        <p className="mt-1 text-sm text-gray-500">
          {application.company_name} - {application.title}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className={`mt-1 inline-block px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor(application.status)}`}>
                {getStatusLabel(application.status)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applied On</p>
              <p className="mt-1 text-gray-900">{new Date(application.applied_at).toLocaleString()}</p>
            </div>
            {(application.admin_feedback || application.mentor_feedback) && (
              <div>
                <p className="text-sm text-gray-500">Feedback</p>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {application.admin_feedback || application.mentor_feedback}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
          {statusHistory.length > 0 ? (
            <div className="space-y-4">
              {sortedHistory.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.to_status).split(' ')[0]}`}></div>
                    {index < sortedHistory.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 ml-1.5"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getStatusLabel(entry.from_status)} → {getStatusLabel(entry.to_status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.changed_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      By: {entry.changed_by_name}
                    </p>
                    {entry.feedback && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                        {entry.feedback}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No status changes yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}

