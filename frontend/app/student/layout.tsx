// app/student/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/student/Sidebar";
import { Header } from "@/components/student/Header";
import apiClient from "@/lib/axios";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) {
      console.log("Student layout: Already fetched, skipping...");
      return;
    }
    hasFetched.current = true;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    console.log("Student layout: useEffect running, isMounted =", isMounted);

    const verify = async () => {
      try {
        console.log("Student layout: Starting profile verification...");
        
        // Ensure we have a token before making the request
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.log("Student layout: No token found, redirecting to login");
          if (!hasRedirected.current && isMounted) {
            hasRedirected.current = true;
            router.replace("/login");
          }
          if (isMounted) setLoading(false);
          return;
        }

        console.log("Student layout: Token found, making API call...");

        // Set a timeout to ensure loading doesn't hang forever
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error("Profile fetch timeout - taking too long, forcing loading to false");
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        // Fetch student profile - backend will check RBAC
        console.log("Student layout: Calling /student/profile...");
        const response = await apiClient.get("/student/profile");
        console.log("Student layout: API response received:", response.data);
        
        if (timeoutId) clearTimeout(timeoutId);
        
        // Don't check isMounted/cancelled here - React will handle unmounted state updates gracefully
        // If component unmounted, React will ignore the state update, but we should still try
        // This prevents the "Component cancelled, aborting" issue in StrictMode

        const userProfile = response.data?.profile;
        
        if (!userProfile) {
          console.error("No profile in response:", response.data);
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            localStorage.removeItem("access_token");
            router.replace("/login");
          }
          setLoading(false);
          return;
        }

        // Verify role (should already be checked by backend, but double-check if role is present)
        // Note: Backend middleware already validates role, so this is just a safety check
        if (userProfile.role && userProfile.role !== "student") {
          console.error("Wrong role in profile:", userProfile.role);
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace("/not-authorized");
          }
          setLoading(false);
          return;
        }

        // Add role if not present (backend middleware already validated it's a student)
        if (!userProfile.role) {
          userProfile.role = "student";
        }

        console.log("Profile loaded successfully:", userProfile);
        
        // Always try to set state - React will ignore if component unmounted
        // This is safe even in StrictMode double-render scenarios
        try {
          setProfile(userProfile);
          setLoading(false);
          console.log("Student layout: Loading set to false, profile set");
        } catch (err) {
          console.error("Error setting state (component may have unmounted):", err);
          // Even if there's an error, try to set loading to false
          setLoading(false);
        }
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);

        console.error("Student layout error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        // Prevent multiple redirects
        if (hasRedirected.current) {
          setLoading(false);
          return;
        }
        hasRedirected.current = true;

        // Handle different error cases
        if (error.response?.status === 401) {
          // Unauthorized - token invalid or expired
          localStorage.removeItem("access_token");
          router.replace("/login");
          setLoading(false);
          return;
        } else if (error.response?.status === 403) {
          // Forbidden - wrong role
          const currentRole = error.response?.data?.currentRole;
          
          // Redirect based on actual role from error response
          if (currentRole === "hod") {
            router.replace("/hod/dashboard");
          } else if (currentRole === "faculty") {
            router.replace("/faculty/dashboard");
          } else {
            router.replace("/not-authorized");
          }
          setLoading(false);
          return;
        } else if (error.response?.status === 404) {
          // Profile not found
          localStorage.removeItem("access_token");
          router.replace("/login");
          setLoading(false);
          return;
        } else {
          // Other errors - always set loading to false
          console.error("Student layout error - setting loading to false");
          setLoading(false);
          
          // For network errors, don't redirect immediately
          if (error.code === 'ERR_NETWORK' || !error.response) {
            // Network error - show error but don't redirect
            console.error("Network error - backend might be down");
          } else {
            // Other errors - redirect to login
            localStorage.removeItem("access_token");
            router.replace("/login");
          }
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If no profile after loading, show error message but still render children
  // This prevents Next.js from showing 404
  if (!profile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Student Portal</h1>
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Unable to load profile. Please try logging in again.</p>
              <button
                onClick={() => router.replace("/login")}
                className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Go to Login
              </button>
            </div>
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={profile.full_name} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

