// components/admin/StatusBadge.tsx
import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();
    
    if (normalized === "applied") {
      return "bg-gray-100 text-gray-800";
    } else if (normalized === "shortlisted" || normalized === "mentor_approved") {
      return "bg-blue-100 text-blue-800";
    } else if (normalized === "selected") {
      return "bg-green-100 text-green-800";
    } else if (normalized === "rejected" || normalized === "not_shortlisted" || normalized === "mentor_rejected") {
      return "bg-red-100 text-red-800";
    } else {
      return "bg-amber-100 text-amber-800";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}

