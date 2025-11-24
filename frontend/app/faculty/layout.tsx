// app/faculty/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/faculty/Sidebar";
import { Header } from "@/components/faculty/Header";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
}

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const routerRef = useRef(router);

  // Keep router ref updated
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          routerRef.current.replace("/login");
          setLoading(false);
          return;
        }

        // Fetch faculty profile - backend will check RBAC
        const response = await apiClient.get("/faculty/profile");
        const userProfile = response.data.profile;

        if (userProfile.role !== "faculty") {
          routerRef.current.push("/not-authorized");
          setLoading(false);
          return;
        }

        setProfile(userProfile);
        setLoading(false);
      } catch (error: any) {
        console.error("Faculty layout error:", error);
        
        if (error.response?.status === 401) {
          // Unauthorized - token invalid or expired
          localStorage.removeItem("access_token");
          routerRef.current.replace("/login");
          setLoading(false);
          return;
        } else if (error.response?.status === 403) {
          // Forbidden - wrong role
          const currentRole = error.response?.data?.currentRole;
          
          // Redirect based on actual role from error response
          if (currentRole === "hod") {
            routerRef.current.replace("/hod/dashboard");
          } else if (currentRole === "student") {
            routerRef.current.replace("/student/dashboard");
          } else {
            routerRef.current.replace("/not-authorized");
          }
          setLoading(false);
          return;
        } else {
          // Other errors - redirect to login
          localStorage.removeItem("access_token");
          routerRef.current.replace("/login");
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []); // Empty deps - only run once on mount

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size={32} className="text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
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

