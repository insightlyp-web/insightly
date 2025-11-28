// components/shared/ProfileCard.tsx
"use client";

import { useRouter } from "next/navigation";

interface ProfileCardProps {
  userName: string;
  role: "student" | "faculty" | "hod" | "admin";
  department?: string;
  email?: string;
}

const getRoleLabel = (role: string, department?: string) => {
  switch (role) {
    case "student":
      return department ? `${department} Student` : "Student";
    case "faculty":
      return department ? `${department} Faculty` : "Faculty";
    case "hod":
      return department ? `HOD - ${department}` : "Head of Department";
    case "admin":
      return "Placement Officer";
    default:
      return "User";
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "student":
      // Student icon - graduation cap
      return (
        <svg viewBox="0 0 24 24" className="w-4 fill-white">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        </svg>
      );
    case "faculty":
      // Faculty icon - person with book
      return (
        <svg viewBox="0 0 24 24" className="w-4 fill-white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          <path d="M21 5h-8v14h8V5zm-2 12h-4V7h4v10z" />
        </svg>
      );
    case "hod":
      // HOD icon - person with badge
      return (
        <svg viewBox="0 0 24 24" className="w-4 fill-white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          <path d="M19 3h-2v1h-1v2h1v1h2V6h1V4h-1V3zm-1 4h-2v7h2V7z" />
        </svg>
      );
    case "admin":
      // Admin icon - shield
      return (
        <svg viewBox="0 0 24 24" className="w-4 fill-white">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      );
    default:
      // Default person icon
      return (
        <svg viewBox="0 0 15 15" className="w-4 fill-white">
          <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" />
        </svg>
      );
  }
};

const getGradientColors = (role: string) => {
  // Using blue shades to match the existing UI
  switch (role) {
    case "student":
      return "from-blue-400 to-blue-600";
    case "faculty":
      return "from-blue-500 to-indigo-600";
    case "hod":
      return "from-indigo-500 to-blue-600";
    case "admin":
      return "from-blue-600 to-indigo-700";
    default:
      return "from-blue-400 to-blue-600";
  }
};

export function ProfileCard({ userName, role, department, email }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex justify-center items-center w-8 h-8 rounded-full bg-gradient-to-r ${getGradientColors(role)}`}>
        {getRoleIcon(role)}
      </div>
      <div className="flex flex-col">
        <span className="text-gray-900 font-medium text-xs leading-tight">{userName}</span>
        <span className="text-gray-500 text-xs leading-tight">
          {getRoleLabel(role, department)}
        </span>
      </div>
    </div>
  );
}

// Separate Logout Button Component
export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="logout-btn"
      title="Logout"
    >
      <div className="sign">
        <svg viewBox="0 0 512 512">
          <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
        </svg>
      </div>
      <div className="text">Logout</div>
    </button>
  );
}

