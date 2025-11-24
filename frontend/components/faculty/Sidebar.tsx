// components/faculty/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: "/icons_faculty/Dashboard.png" },
  { name: "Courses", href: "/faculty/courses", icon: "/icons_faculty/Courses.png" },
  { name: "Create Session", href: "/faculty/attendance/create", icon: "/icons_faculty/Create Session.png" },
  { name: "Sessions History", href: "/faculty/attendance/sessions", icon: "/icons_faculty/Sessions History.png" },
  { name: "Assessments", href: "/faculty/marks/assessments", icon: "/icons_faculty/Assessments.png" },
  { name: "Create Assessment", href: "/faculty/marks/assessments/create", icon: "/icons_faculty/Create Assessment.png" },
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
          const isActive = pathname === item.href || 
            (item.href !== "/faculty/dashboard" && pathname?.startsWith(item.href));
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

