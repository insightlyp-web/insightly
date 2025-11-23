// app/student/attendance/scan/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/student/QRScanner";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";

export default function ScanQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleScan = async (sessionCode: string) => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await apiClient.post("/student/attendance/mark", {
        session_code: sessionCode,
      });

      setMessage({
        type: "success",
        text: response.data.message || "Attendance marked successfully!",
      });

      // Redirect to history after 2 seconds
      setTimeout(() => {
        router.push("/student/attendance/history");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to mark attendance";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="mt-1 text-sm text-gray-500">
          Scan the attendance QR code to mark your attendance
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <QRScanner onScan={handleScan} loading={loading} />

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Allow camera permissions when prompted</li>
          <li>Point your camera at the QR code displayed by your faculty</li>
          <li>Wait for the scan confirmation</li>
          <li>Your attendance will be automatically recorded</li>
        </ul>
      </Card>
    </div>
  );
}

