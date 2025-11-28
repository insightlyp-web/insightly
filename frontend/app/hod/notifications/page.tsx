// app/hod/notifications/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/hod/Card";
import { Table } from "@/components/hod/Table";
import apiClient from "@/lib/axios";

interface Notification {
  id: string;
  recipient_id: string;
  student_name: string;
  student_email: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    attendance_threshold: 65,
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/hod/notifications");
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAtRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      setMessage(null);

      const response = await apiClient.post("/hod/notifications/send-to-at-risk", {
        title: formData.title,
        message: formData.message,
        attendance_threshold: formData.attendance_threshold,
      });

      setMessage({
        type: "success",
        text: response.data.message || `Notifications sent to ${response.data.notifications_sent} students`,
      });

      setFormData({ title: "", message: "", attendance_threshold: 65 });
      setShowSendForm(false);
      await fetchNotifications();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to send notifications",
      });
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { header: "Student", accessor: "student_name" },
    { header: "Email", accessor: "student_email" },
    { header: "Title", accessor: "title" },
    {
      header: "Message",
      accessor: "message",
      render: (value: string) => (
        <span className="text-sm text-gray-600" title={value}>
          {value.length > 50 ? value.substring(0, 50) + "..." : value}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      header: "Read",
      accessor: "read",
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {value ? "Read" : "Unread"}
        </span>
      ),
    },
    {
      header: "Sent At",
      accessor: "created_at",
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Send notifications to at-risk students about their attendance
          </p>
        </div>
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showSendForm ? "Cancel" : "Send to At-Risk Students"}
        </button>
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

      {showSendForm && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Send Notification to At-Risk Students
          </h2>
          <form onSubmit={handleSendToAtRisk} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Attendance Warning"
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="e.g., You are not regular to college. You must come to college regularly to improve your attendance."
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attendance Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.attendance_threshold}
                onChange={(e) => setFormData({ ...formData, attendance_threshold: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Students with attendance below this percentage will receive the notification
              </p>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Notifications"}
            </button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sent Notifications ({notifications.length})
        </h2>
        <Table columns={columns} data={notifications} loading={loading} />
      </div>
    </div>
  );
}

