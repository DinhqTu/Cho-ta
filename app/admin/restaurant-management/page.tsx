"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { AdminGuard } from "@/components/auth-guard";
import { getApprovedRestaurants, RestaurantDoc } from "@/lib/api/restaurants";
import { toast } from "sonner";
import {
  Settings,
  Store,
  Clock,
  Truck,
  MapPin,
  Calendar,
  Search,
  Filter,
} from "lucide-react";

export default function RestaurantManagementPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "static" | "dynamic">(
    "all",
  );

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const data = await getApprovedRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Không thể tải danh sách quán ăn");
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || restaurant.menuType === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleManageRestaurant = (restaurantId: string) => {
    router.push(`/restaurant/manage/${restaurantId}`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <AdminGuard>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          </div>
        </AdminGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý quán ăn
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Quản lý thông tin và thực đơn của các quán ăn
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên quán hoặc địa chỉ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) =>
                      setFilterType(
                        e.target.value as "all" | "static" | "dynamic",
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="all">Tất cả</option>
                    <option value="static">Menu cố định</option>
                    <option value="dynamic">Menu động</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Grid */}
          <div className="max-w-7xl mx-auto px-4 pb-8">
            {filteredRestaurants.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterType !== "all"
                    ? "Không tìm thấy quán ăn nào"
                    : "Chưa có quán ăn nào"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== "all"
                    ? "Thử thay đổi điều kiện tìm kiếm"
                    : "Thêm quán ăn đầu tiên để bắt đầu quản lý"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.$id}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
                  >
                    {/* Header Image */}
                    <div className="relative h-48 rounded-t-xl overflow-hidden">
                      <img
                        src={
                          restaurant.image ||
                          "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop"
                        }
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            restaurant.menuType === "dynamic"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {restaurant.menuType === "dynamic"
                            ? "Menu động"
                            : "Menu cố định"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {restaurant.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {restaurant.address || "Địa chỉ đang cập nhật"}
                          </div>
                        </div>
                      </div>

                      {/* Info Cards */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Clock className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                          <p className="text-xs text-gray-600">
                            {restaurant.orderDeadline}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <Truck className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                          <p className="text-xs text-gray-600">
                            {restaurant.deliveryTime}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                          <p className="text-xs text-gray-600">
                            {restaurant.distance}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {restaurant.freeship && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            🚚 Freeship
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleManageRestaurant(restaurant.$id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Quản lý quán ăn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
