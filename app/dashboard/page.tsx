"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { formatMoney } from "@/lib/utils";
import { getDashboardStats, DashboardStats } from "@/lib/api/dashboard-stats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  Award,
} from "lucide-react";

const COLORS = ["#D4AF37", "#C5A028", "#B8942A", "#AA8820", "#9C7C18"];

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#D4AF37",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const iconStyle: React.CSSProperties = { color };
  return (
    <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#2A2A2A]/60">{title}</p>
          <p className="text-2xl font-bold text-[#2A2A2A] mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#2A2A2A]/50 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {React.createElement(Icon, {
            className: "w-6 h-6",
            style: iconStyle,
          })}
        </div>
      </div>
    </div>
  );
}

// Format date for display
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" });
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = stats.dailyData.map((d) => ({
    ...d,
    name: formatDateShort(d.date),
  }));

  return (
    <div className="min-h-screen bg-[#F8F4EE]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">Dashboard</h1>
            <p className="text-sm text-[#2A2A2A]/50">Thống kê đơn hàng</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FBF8F4] hover:bg-[#F5EDE3] transition-colors text-[#2A2A2A]/70"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Làm mới</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Today Stats */}
        <div>
          <h2 className="text-lg font-semibold text-[#2A2A2A] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            Hôm nay
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Đơn hàng"
              value={stats.today.orders}
              icon={ShoppingBag}
            />
            <StatCard
              title="Số món"
              value={stats.today.items}
              icon={TrendingUp}
              color="#4ECDC4"
            />
            <StatCard
              title="Doanh thu"
              value={formatMoney(stats.today.amount)}
              icon={DollarSign}
              color="#FF6B6B"
            />
            <StatCard
              title="Đã thanh toán"
              value={formatMoney(stats.today.paidAmount)}
              subtitle={`${
                stats.today.amount > 0
                  ? Math.round(
                      (stats.today.paidAmount / stats.today.amount) * 100
                    )
                  : 0
              }%`}
              icon={DollarSign}
              color="#4CAF50"
            />
          </div>
        </div>

        {/* Week & Month Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4">Tuần này</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Đơn hàng</p>
                <p className="text-xl font-bold text-[#D4AF37]">
                  {stats.week.orders}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Số món</p>
                <p className="text-xl font-bold text-[#4ECDC4]">
                  {stats.week.items}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Doanh thu</p>
                <p className="text-xl font-bold text-[#FF6B6B]">
                  {formatMoney(stats.week.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Người đặt</p>
                <p className="text-xl font-bold text-[#AA96DA]">
                  {stats.week.users}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4">Tháng này</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Đơn hàng</p>
                <p className="text-xl font-bold text-[#D4AF37]">
                  {stats.month.orders}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Số món</p>
                <p className="text-xl font-bold text-[#4ECDC4]">
                  {stats.month.items}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Doanh thu</p>
                <p className="text-xl font-bold text-[#FF6B6B]">
                  {formatMoney(stats.month.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#2A2A2A]/60">Người đặt</p>
                <p className="text-xl font-bold text-[#AA96DA]">
                  {stats.month.users}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4">
              Doanh thu 7 ngày qua
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9D7B8" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#2A2A2A80"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#2A2A2A80" />
                  <Tooltip
                    formatter={(value: number) => [
                      formatMoney(value),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E9D7B8",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="amount" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4">
              Số đơn 7 ngày qua
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9D7B8" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#2A2A2A80"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#2A2A2A80" />
                  <Tooltip
                    formatter={(value: number) => [value, "Đơn hàng"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E9D7B8",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#4ECDC4"
                    strokeWidth={3}
                    dot={{ fill: "#4ECDC4", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Items & Users */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Items */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              Món bán chạy (tháng)
            </h3>
            {stats.topItems.length > 0 ? (
              <div className="space-y-3">
                {stats.topItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#FBF8F4]"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: COLORS[index] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2A2A2A] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#2A2A2A]/50">
                        {item.quantity} phần · {formatMoney(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#2A2A2A]/50 text-center py-8">
                Chưa có dữ liệu
              </p>
            )}
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4ECDC4]" />
              Khách hàng thân thiết (tháng)
            </h3>
            {stats.topUsers.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsers.map((user, index) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#FBF8F4]"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: COLORS[index] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2A2A2A] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#2A2A2A]/50">
                        {user.orders} đơn · {formatMoney(user.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#2A2A2A]/50 text-center py-8">
                Chưa có dữ liệu
              </p>
            )}
          </div>
        </div>

        {/* Pie Chart for Top Items */}
        {stats.topItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 p-5 shadow-sm">
            <h3 className="font-semibold text-[#2A2A2A] mb-4">
              Tỷ lệ món bán (tháng)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topItems}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {stats.topItems.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} phần`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E9D7B8",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Header />
      <div className="pt-16">
        <DashboardContent />
      </div>
    </AuthGuard>
  );
}
