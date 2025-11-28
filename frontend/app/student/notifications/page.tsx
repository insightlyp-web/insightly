// app/student/notifications/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/student/notifications");
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      await apiClient.delete(`/student/notifications/${notificationId}`);
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error("Failed to delete notification:", error);
      alert(error.response?.data?.message || "Failed to delete notification");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size={32} className="text-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your academic and placement notifications
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No notifications</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.read ? "border-l-4 border-l-blue-600" : ""}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {notification.type && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                      {notification.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete notification"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

