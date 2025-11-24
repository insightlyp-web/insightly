// components/admin/Header.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  userName: string;
  currentPage?: string;
}

export function Header({ userName, currentPage }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const getPageTitle = () => {
    if (currentPage) return currentPage;
    return "Admin Dashboard";
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Insightly Logo" width={28} height={28} className="rounded" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Insightly Dashboard
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">Welcome, {userName}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Placement Officer
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

