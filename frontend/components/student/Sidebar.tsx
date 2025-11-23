// components/student/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: "📊" },
  { name: "Courses", href: "/student/courses", icon: "📚" },
  { name: "Resume Analysis", href: "/student/resume", icon: "📄" },
  { name: "Attendance Summary", href: "/student/attendance/summary", icon: "📈" },
  { name: "Attendance History", href: "/student/attendance/history", icon: "📅" },
  { name: "Scan QR", href: "/student/attendance/scan", icon: "📷" },
  { name: "Today's Timetable", href: "/student/timetable/today", icon: "⏰" },
  { name: "Weekly Timetable", href: "/student/timetable/week", icon: "📆" },
  { name: "Placement Posts", href: "/student/placement/posts", icon: "💼" },
  { name: "My Applications", href: "/student/placement/applications", icon: "📝" },
  { name: "Notifications", href: "/student/notifications", icon: "🔔" },
  { name: "Events", href: "/student/events", icon: "🎉" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CampusAI</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/student/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

