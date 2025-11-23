// app/admin/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import apiClient from "@/lib/axios";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

        // Fetch admin profile - backend will check RBAC
        const response = await apiClient.get("/admin/profile");
        const userProfile = response.data.profile;

        if (userProfile.role !== "admin") {
          routerRef.current.replace("/not-authorized");
          setLoading(false);
          return;
        }

        setProfile(userProfile);
        setLoading(false);
      } catch (error: any) {
        console.error("Admin layout error:", error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("access_token");
          routerRef.current.replace("/login");
          setLoading(false);
          return;
        } else {
          localStorage.removeItem("access_token");
          routerRef.current.replace("/login");
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Checking admin access...</p>
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

