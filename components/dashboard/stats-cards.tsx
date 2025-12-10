"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Order } from "@/lib/data";

interface StatsCardsProps {
  orders: Order[];
}

export function StatsCards({ orders }: StatsCardsProps) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing"
  ).length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: Package,
      gradient: "from-[#FF6B35] to-[#FF8C42]",
    },
    {
      title: "In Progress",
      value: pendingOrders,
      icon: Clock,
      gradient: "from-[#FF8C42] to-[#FFA500]",
    },
    {
      title: "Completed",
      value: completedOrders,
      icon: CheckCircle,
      gradient: "from-[#FFA500] to-[#FFB833]",
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: "from-[#FF6B35] to-[#FFA500]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-[#FF6B35] to-[#FFA500] bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
