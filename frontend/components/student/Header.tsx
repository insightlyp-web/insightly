// components/student/Header.tsx
"use client";

import { ProfileCard, LogoutButton } from "@/components/shared/ProfileCard";

interface HeaderProps {
  userName: string;
  department?: string;
  role?: string;
  onMenuClick?: () => void;
}

export function Header({ userName, department, role = "student", onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open menu</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <ProfileCard userName={userName} role={role as "student"} department={department} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

