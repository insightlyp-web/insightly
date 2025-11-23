// app/not-authorized/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import apiClient from "@/lib/axios";

export default function NotAuthorizedPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const hasChecked = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Try to get user role to show appropriate message and auto-redirect
    const checkRole = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const response = await apiClient.get("/auth/check-profile");
          if (response.data?.profile) {
            const role = response.data.profile.role;
            setUserRole(role);
            
            // Auto-redirect to appropriate dashboard after 1 second (only once)
            if (!hasRedirected.current) {
              hasRedirected.current = true;
              setTimeout(() => {
                try {
                  if (role === "student") {
                    router.replace("/student/dashboard");
                  } else if (role === "faculty") {
                    router.replace("/faculty/dashboard");
                  } else if (role === "hod") {
                    router.replace("/hod/dashboard");
                  }
                } catch (err) {
                  console.error("Redirect error:", err);
                }
              }, 1000);
            }
          }
        }
      } catch (error) {
        // Ignore errors - user might not have a profile yet
        console.log("Could not fetch profile in not-authorized page:", error);
      }
    };
    checkRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once

  const handleRedirect = () => {
    try {
      if (userRole === "student") {
        router.replace("/student/dashboard");
      } else if (userRole === "faculty") {
        router.replace("/faculty/dashboard");
      } else if (userRole === "hod") {
        router.replace("/hod/dashboard");
      } else {
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    } catch (err) {
      console.error("Redirect error:", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-8">
          {userRole 
            ? `You do not have permission to access this page. Your role is "${userRole}". Please access your appropriate dashboard.`
            : "You do not have permission to access this page. Please sign in with the correct account."}
        </p>
        <div className="flex flex-col space-y-3">
          {userRole && (
            <button
              onClick={handleRedirect}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Go to {userRole === "student" ? "Student" : userRole === "faculty" ? "Faculty" : "HOD"} Dashboard
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              router.push("/login");
            }}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

