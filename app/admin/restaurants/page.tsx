"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminGuard } from "@/components/auth-guard";
import {
  getPendingRestaurants,
  getRestaurants,
  updateRestaurantStatus,
  RestaurantDoc,
} from "@/lib/api/restaurants";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Truck,
  Eye,
  Filter,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantDoc | null>(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      let data: RestaurantDoc[];
      if (statusFilter === "pending") {
        data = await getPendingRestaurants();
      } else {
        data = await getRestaurants(
          statusFilter === "all" ? undefined : statusFilter,
        );
      }
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Không thể tải danh sách quán ăn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [statusFilter]);

  const handleApprove = async (restaurantId: string) => {
    setProcessing(restaurantId);
    try {
      const success = await updateRestaurantStatus(restaurantId, "approved");
      if (success) {
        toast.success("Đã duyệt quán ăn thành công!");
        fetchRestaurants();
      } else {
        throw new Error("Failed to approve restaurant");
      }
    } catch (error) {
      console.error("Error approving restaurant:", error);
      toast.error("Không thể duyệt quán ăn. Vui lòng thử lại.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (restaurantId: string) => {
    setProcessing(restaurantId);
    try {
      const success = await updateRestaurantStatus(restaurantId, "rejected");
      if (success) {
        toast.success("Đã từ chối quán ăn!");
        fetchRestaurants();
      } else {
        throw new Error("Failed to reject restaurant");
      }
    } catch (error) {
      console.error("Error rejecting restaurant:", error);
      toast.error("Không thể từ chối quán ăn. Vui lòng thử lại.");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const filteredCount = restaurants.length;
  const pendingCount =
    statusFilter === "all"
      ? restaurants.filter((r) => r.status === "pending").length
      : restaurants.filter((r) => r.status === "pending").length;

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="min-h-screen bg-[#F8F4EE] pt-20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2">
                Quản lý quán ăn
              </h1>
              <p className="text-[#2A2A2A]/60">
                Duyệt và quản lý các quán ăn được người dùng đăng ký
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E9D7B8]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#2A2A2A]/60 mb-1">Tổng số</p>
                    <p className="text-2xl font-bold text-[#2A2A2A]">
                      {filteredCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E9D7B8]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#2A2A2A]/60 mb-1">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E9D7B8]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#2A2A2A]/60 mb-1">Đã duyệt</p>
                    <p className="text-2xl font-bold text-green-600">
                      {
                        restaurants.filter((r) => r.status === "approved")
                          .length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E9D7B8]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#2A2A2A]/60 mb-1">Đã từ chối</p>
                    <p className="text-2xl font-bold text-red-600">
                      {
                        restaurants.filter((r) => r.status === "rejected")
                          .length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E9D7B8]/30 mb-6">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-[#2A2A2A]/60" />
                <span className="font-medium text-[#2A2A2A]">
                  Lọc theo trạng thái:
                </span>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "Tất cả" },
                    { value: "pending", label: "Chờ duyệt" },
                    { value: "approved", label: "Đã duyệt" },
                    { value: "rejected", label: "Đã từ chối" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() =>
                        setStatusFilter(filter.value as StatusFilter)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === filter.value
                          ? "bg-[#D4AF37] text-white"
                          : "bg-gray-100 text-[#2A2A2A]/70 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Restaurants List */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E9D7B8]/30">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                  <p className="mt-4 text-[#2A2A2A]/60">Đang tải...</p>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <MapPin className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có quán ăn nào
                  </h3>
                  <p className="text-gray-500">
                    {statusFilter === "pending"
                      ? "Không có quán ăn nào đang chờ duyệt."
                      : "Không có quán ăn nào phù hợp với bộ lọc."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E9D7B8]/30">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.$id}
                      className="p-6 hover:bg-[#FBF8F4] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#2A2A2A]">
                              {restaurant.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(restaurant.status)}`}
                            >
                              {getStatusText(restaurant.status)}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-[#2A2A2A]/70">
                            {restaurant.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{restaurant.address}</span>
                              </div>
                            )}

                            {restaurant.description && (
                              <p className="text-[#2A2A2A]/60 italic">
                                {restaurant.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Chốt đơn: {restaurant.orderDeadline}
                                </span>
                              </div>

                              {restaurant.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{restaurant.distance}</span>
                                </div>
                              )}

                              {restaurant.deliveryTime && (
                                <div className="flex items-center gap-1">
                                  <Truck className="w-4 h-4" />
                                  <span>{restaurant.deliveryTime}</span>
                                </div>
                              )}

                              {restaurant.freeship && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Freeship
                                </span>
                              )}
                            </div>

                            {restaurant.image && (
                              <div className="mt-3">
                                <img
                                  src={restaurant.image}
                                  alt={restaurant.name}
                                  className="w-32 h-20 object-cover rounded-lg border border-[#E9D7B8]/30"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {restaurant.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(restaurant.$id)}
                                disabled={processing === restaurant.$id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {processing === restaurant.$id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Duyệt
                              </button>

                              <button
                                onClick={() => handleReject(restaurant.$id)}
                                disabled={processing === restaurant.$id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {processing === restaurant.$id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
