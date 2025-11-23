// app/student/notifications/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                {notification.type && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md ml-4">
                    {notification.type}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

