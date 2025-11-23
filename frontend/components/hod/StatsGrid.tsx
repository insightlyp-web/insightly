// components/hod/StatsGrid.tsx
import { Card } from "./Card";

interface Stat {
  name: string;
  value: string | number;
  icon: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

