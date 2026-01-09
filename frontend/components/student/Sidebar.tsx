// components/student/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: "/icons_student/Dashboard.png" },
  { name: "Courses", href: "/student/courses", icon: "/icons_student/Courses.png" },
  { name: "Resume Analysis", href: "/student/resume", icon: "/icons_student/Resume Analysis.png" },
  { name: "Attendance Summary", href: "/student/attendance/summary", icon: "/icons_student/Attendance Summary.png" },
  { name: "Attendance History", href: "/student/attendance/history", icon: "/icons_student/Attendance History.png" },
  { name: "Scan QR", href: "/student/attendance/scan", icon: "/icons_student/Scan QR.png" },
  { name: "Today's Timetable", href: "/student/timetable/today", icon: "/icons_student/Today's Timetable.png" },
  { name: "Weekly Timetable", href: "/student/timetable/week", icon: "/icons_student/Weekly Timetable.png" },
  { name: "Placement Posts", href: "/student/placement/posts", icon: "/icons_student/Placement Posts.png" },
  { name: "My Applications", href: "/student/placement/applications", icon: "/icons_student/My Applications.png" },
  { name: "Notifications", href: "/student/notifications", icon: "/icons_student/Notifications.png" },
  { name: "Events", href: "/student/events", icon: "/icons_student/Events.png" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex
        ${isOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"}
      `}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Insightly Logo" width={32} height={32} className="rounded" />
            <h1 className="text-xl font-bold text-gray-900">Insightly</h1>
          </div>
          {/* Close button for mobile */}
          <button
            type="button"
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/student/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose} // Auto-close on mobile nav
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={20}
                  height={20}
                  className="mr-3"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

