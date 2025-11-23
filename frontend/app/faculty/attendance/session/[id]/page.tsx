// app/faculty/attendance/session/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/faculty/Card";
import { Table } from "@/components/faculty/Table";
import apiClient from "@/lib/axios";

interface AttendanceRecord {
  student_name: string;
  timestamp: string;
}

interface SessionInfo {
  session_code: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  code?: string;
  name?: string;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/faculty/attendance/sessions/${sessionId}`);
      setSessionInfo(response.data.session || null);
      setRecords(response.data.records || []);
    } catch (error: any) {
      console.error("Failed to fetch session data:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Student Name", accessor: "student_name" },
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
        >
          ← Back to Sessions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          Attendance records for this session
        </p>
      </div>

      {sessionInfo && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Session Code</p>
              <p className="text-lg font-semibold text-gray-900">{sessionInfo.session_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="text-lg font-semibold text-gray-900">
                {sessionInfo.course_code} - {sessionInfo.course_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="text-sm text-gray-900">
                {new Date(sessionInfo.start_time).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="text-sm text-gray-900">
                {new Date(sessionInfo.end_time).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Students Present ({records.length})
        </h2>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  );
}

