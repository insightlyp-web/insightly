// components/admin/AnalyticsCards.tsx
import Image from "next/image";
import { StatCard } from "./StatCard";

interface AnalyticsCardsProps {
  totalPosts: number;
  totalApplications: number;
  statusBreakdown?: Array<{ status: string; count: number }>;
}

export function AnalyticsCards({
  totalPosts,
  totalApplications,
  statusBreakdown,
}: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Posts"
        value={totalPosts}
        description="All placement posts"
        icon={<Image src="/icons_admin/Posts.png" alt="Total Posts" width={24} height={24} />}
      />
      <StatCard
        title="Total Applications"
        value={totalApplications}
        description="All student applications"
        icon={<Image src="/icons_admin/Applications.png" alt="Total Applications" width={24} height={24} />}
      />
      {statusBreakdown?.map((item) => (
        <StatCard
          key={item.status}
          title={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          value={item.count}
          description={`Applications with ${item.status} status`}
        />
      ))}
    </div>
  );
}

