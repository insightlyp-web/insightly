// components/admin/Header.tsx
"use client";

import { ProfileCard, LogoutButton } from "@/components/shared/ProfileCard";

interface HeaderProps {
  userName: string;
  currentPage?: string;
}

export function Header({ userName, currentPage }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <ProfileCard userName={userName} role="admin" />
        <LogoutButton />
      </div>
    </header>
  );
}

