"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "./stats-cards";
import { OrderTable } from "./order-table";
import { OrderDialog } from "./order-dialog";
import { mockOrders, Order, OrderStatus } from "@/lib/data";
import { Search, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && order.status === activeTab;
  });

  return (
    <div className="min-h-screen gradient-bg p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFA500] bg-clip-text text-transparent">
              Order Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your orders in one place 🍕
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FFA500] text-white rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatsCards orders={orders} />

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] transition-all duration-300 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Tabs & Table */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-1 h-auto flex-wrap">
            {[
              { value: "all", label: "All Orders" },
              { value: "pending", label: "Pending" },
              { value: "preparing", label: "Preparing" },
              { value: "ready", label: "Ready" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35] data-[state=active]:to-[#FFA500] data-[state=active]:text-white transition-all duration-300 px-4 py-2"
              >
                {tab.label}
                {tab.value !== "all" && (
                  <span className="ml-2 text-xs opacity-70">
                    ({orders.filter((o) => o.status === tab.value).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredOrders.length > 0 ? (
              <OrderTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  No orders found 🔍
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Dialog */}
        <OrderDialog
          order={selectedOrder}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </div>
  );
}
