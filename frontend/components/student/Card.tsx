// components/student/Card.tsx
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 shadow-md rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

