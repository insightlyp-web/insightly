// components/faculty/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: "📊" },
  { name: "Courses", href: "/faculty/courses", icon: "📚" },
  { name: "Create Session", href: "/faculty/attendance/create", icon: "➕" },
  { name: "Sessions History", href: "/faculty/attendance/sessions", icon: "📅" },
  { name: "Assessments", href: "/faculty/marks/assessments", icon: "📝" },
  { name: "Create Assessment", href: "/faculty/marks/assessments/create", icon: "✏️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CampusAI</h1>
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
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

