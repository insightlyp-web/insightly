// app/admin/analytics/overview/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/hod/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import apiClient from "@/lib/axios";

interface OverviewData {
  total_posts: number;
  total_applications: number;
  status_breakdown: Array<{ status: string; count: number }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const response = await apiClient.get("/admin/analytics/overview");
        setData(response.data);
      } catch (error: any) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Spinner size={32} className="text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const pieData = data?.status_breakdown?.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    value: item.count,
  })) || [];

  const barData = data?.status_breakdown?.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " "),
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Comprehensive analytics for placement posts and applications
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Posts"
          value={data?.total_posts || 0}
          description="All placement posts"
          icon={<Image src="/icons_admin/Posts.png" alt="Total Posts" width={24} height={24} />}
        />
        <StatCard
          title="Total Applications"
          value={data?.total_applications || 0}
          description="All student applications"
          icon={<Image src="/icons_admin/Applications.png" alt="Total Applications" width={24} height={24} />}
        />
        <StatCard
          title="Active Posts"
          value={data?.total_posts || 0}
          description="Currently active posts"
        />
        <StatCard
          title="Avg Applications/Post"
          value={data?.total_posts ? Math.round((data.total_applications / data.total_posts) * 10) / 10 : 0}
          description="Average applications per post"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status Distribution
          </h3>
          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-500">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status Breakdown
          </h3>
          {barData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-500">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

