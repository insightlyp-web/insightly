// components/admin/StatCard.tsx
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 text-blue-600">{icon}</div>
        )}
      </div>
    </div>
  );
}

