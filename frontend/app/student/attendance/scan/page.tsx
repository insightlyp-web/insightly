"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/student/QRScanner";
import { Card } from "@/components/student/Card";
import apiClient from "@/lib/axios";
import { CheckCircle, XCircle, ArrowLeft, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";

interface SessionDetails {
  session_code: string;
  course_name: string;
  course_code: string;
  start_time: string;
  end_time: string;
  location_required: boolean;
  allowed_radius?: number;
  faculty_lat?: number;
  faculty_lng?: number;
}

export default function ScanQRPage() {
  const router = useRouter();
  const [scanStatus, setScanStatus] = useState<"idle" | "processing" | "success" | "error" | "location_required">("idle");
  const [message, setMessage] = useState<string>("");
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);

  const getStudentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleScan = async (sessionCode: string) => {
    if (scanStatus !== "idle") return;

    try {
      setScanStatus("processing");
      setMessage("");
      setLocationError("");

      // First, get session details to check if location is required
      const sessionResponse = await apiClient.get(`/student/attendance/session/${sessionCode}`);
      const session = sessionResponse.data.session;

      if (!session) {
        throw new Error("Session not found");
      }

      setSessionDetails(session);

      // If location is required, prompt for location
      if (session.location_required) {
        setScanStatus("location_required");
        setLocationLoading(true);

        try {
          const studentLocation = await getStudentLocation();
          setLocationLoading(false);

          // Now mark attendance with location
          const response = await apiClient.post("/student/attendance/mark", {
            session_code: sessionCode,
            student_lat: studentLocation.lat,
            student_lng: studentLocation.lng,
          });

          setMessage(response.data.message || "Attendance marked successfully!");
          setScanStatus("success");
        } catch (locationErr: any) {
          setLocationLoading(false);
          setLocationError("Location access required to mark attendance. Please enable location permissions.");
          setScanStatus("error");
          setMessage("Location access denied");
        }
      } else {
        // Location not required, mark attendance normally
        const response = await apiClient.post("/student/attendance/mark", {
          session_code: sessionCode,
        });

        setMessage(response.data.message || "Attendance marked successfully!");
        setScanStatus("success");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to mark attendance";
      setMessage(errorMessage);
      setScanStatus("error");
      setLocationLoading(false);
    }
  };

  const resetScan = () => {
    setScanStatus("idle");
    setMessage("");
    setSessionDetails(null);
    setLocationError("");
    setLocationLoading(false);
  };

  return (
    <div className="space-y-6 relative min-h-[80vh]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
          <p className="mt-1 text-sm text-gray-500">
            Point your camera at the faculty QR code
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="relative">
        {scanStatus === "idle" && (
          <QRScanner onScan={handleScan} loading={false} />
        )}

        <AnimatePresence>
          {scanStatus === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white"
            >
              <Spinner size={48} className="text-brand-cyan mb-4" />
              <p className="text-lg font-medium">Verifying QR Code...</p>
            </motion.div>
          )}

          {scanStatus === "location_required" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-500/95 text-white p-6 text-center"
            >
              {locationLoading ? (
                <>
                  <Spinner size={48} className="text-white mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Getting Your Location...</h2>
                  <p className="text-blue-100 text-lg">
                    Please allow location access to mark attendance
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="bg-white rounded-full p-4 mb-6"
                  >
                    <MapPin className="w-16 h-16 text-blue-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Location Required</h2>
                  <p className="text-blue-100 text-lg mb-4">
                    This session requires location verification
                  </p>
                  {sessionDetails && (
                    <p className="text-blue-200 text-sm mb-6">
                      Allowed radius: {sessionDetails.allowed_radius || 50} meters
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}

          {scanStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-500/95 text-white p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-white rounded-full p-4 mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Marked as Attended!</h2>
              <p className="text-green-100 text-lg mb-8">{message}</p>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/student/attendance/history")}
                  className="px-6 py-3 bg-white text-green-600 font-bold rounded-xl shadow-lg hover:bg-green-50 transition-colors"
                >
                  View History
                </button>
                <button
                  onClick={() => router.push("/student/dashboard")}
                  className="px-6 py-3 bg-green-600 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {scanStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-500/95 text-white p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-white rounded-full p-4 mb-6"
              >
                <XCircle className="w-16 h-16 text-red-500" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Scan Failed</h2>
              <p className="text-red-100 text-lg mb-4">{message}</p>
              {locationError && (
                <p className="text-red-200 text-sm mb-4">{locationError}</p>
              )}

              <button
                onClick={resetScan}
                className="px-8 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Ensure you are connected to the campus Wi-Fi</li>
          <li>Point your camera directly at the QR code</li>
          <li>Hold steady until the scan completes</li>
        </ul>
      </Card>
    </div>
  );
}
