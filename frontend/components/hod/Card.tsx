// components/hod/Card.tsx
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white shadow-lg border border-gray-200 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}

