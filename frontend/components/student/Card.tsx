import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 shadow-md rounded-xl p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

