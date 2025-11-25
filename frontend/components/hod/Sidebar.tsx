// components/hod/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/hod/dashboard", icon: "/icons_hod/Dashboard.png" },
  { name: "Students", href: "/hod/students", icon: "/icons_hod/Students.png" },
  { name: "Faculty", href: "/hod/faculty", icon: "/icons_hod/Faculty.png" },
  { name: "Courses", href: "/hod/courses", icon: "/icons_hod/Courses.png" },
  { name: "Map Courses", href: "/hod/courses/map", icon: "/icons_hod/Map Courses.png" },
  { name: "Timetable", href: "/hod/timetable", icon: "/icons_hod/Timetable.png" },
  { name: "Attendance Analytics", href: "/hod/attendance", icon: "/icons_hod/Attendance Analytics.png" },
  { name: "Upload Excel", href: "/hod/upload-excel", icon: "/icons_hod/Dashboard.png" },
  { name: "Report", href: "/hod/report", icon: "/icons_hod/Report.png" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <Image src="/logo.png" alt="Insightly Logo" width={32} height={32} className="rounded" />
        <h1 className="text-xl font-bold text-gray-900">Insightly</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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

