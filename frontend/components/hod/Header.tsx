// components/hod/Header.tsx
"use client";

import { ProfileCard, LogoutButton } from "@/components/shared/ProfileCard";

interface HeaderProps {
  department: string;
  userName: string;
  role?: string;
}

export function Header({ department, userName, role = "hod" }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <ProfileCard userName={userName} role={role as "hod"} department={department} />
        <LogoutButton />
      </div>
    </header>
  );
}

