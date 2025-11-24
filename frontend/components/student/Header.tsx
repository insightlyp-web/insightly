// components/student/Header.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
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
            <p className="text-sm text-gray-500">Welcome, {userName}</p>
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

