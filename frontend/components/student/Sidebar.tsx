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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <Image src="/logo.png" alt="Insightly Logo" width={32} height={32} className="rounded" />
        <h1 className="text-xl font-bold text-gray-900">Insightly</h1>
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
  );
}

