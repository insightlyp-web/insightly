// components/admin/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "Posts", href: "/admin/posts", icon: "📝" },
  { name: "Create Post", href: "/admin/posts/create", icon: "➕" },
  { name: "Applications", href: "/admin/posts", icon: "📋" },
  {
    name: "Analytics",
    children: [
      { name: "Overview", href: "/admin/analytics/overview" },
      { name: "Company", href: "/admin/analytics/company" },
      { name: "Department", href: "/admin/analytics/department" },
    ],
  },
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
          if (item.children) {
            return (
              <div key={item.name} className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.name}
                </div>
                {item.children.map((child) => {
                  const isActive = pathname === child.href;
                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md ml-3
                        ${
                          isActive
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            );
          }

          const isActive = pathname === item.href || (item.href !== "/admin/posts" && pathname?.startsWith(item.href));
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

