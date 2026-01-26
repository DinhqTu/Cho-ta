"use client";

import { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { RestaurantCard } from "@/components/restaurant-card";
import {
  CreateRestaurantForm,
  RestaurantFormData,
} from "@/components/create-restaurant-form";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createRestaurant,
  getApprovedRestaurants,
  RestaurantDoc,
} from "@/lib/api/restaurants";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch approved restaurants
  const fetchRestaurants = async () => {
    try {
      const data = await getApprovedRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Không thể tải danh sách quán ăn.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load restaurants on component mount
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleCreateRestaurant = async (data: RestaurantFormData) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để tạo quán ăn.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Add createdBy to data
      const restaurantData = {
        ...data,
        createdBy: user.$id,
      };

      // Call API to create restaurant
      const result = await createRestaurant(restaurantData);

      if (result) {
        // Close form and show success toast
        setShowCreateForm(false);
        toast.success(
          "Yêu cầu tạo quán ăn đã được gửi! Admin sẽ xem xét và duyệt trong thời gian sớm nhất.",
        );
      } else {
        throw new Error("Failed to create restaurant");
      }
    } catch (error) {
      console.error("Error creating restaurant:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      {/* <IzakayaExperience /> */}
      <div className="min-h-screen bg-[#F8F4EE] pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#2A2A2A]">
              Khám phá quán ăn gần bạn
            </h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              Thêm quán ăn
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loading skeletons */}
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.$id}
                  image={
                    restaurant.image ||
                    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop"
                  }
                  name={restaurant.name}
                  address={restaurant.address || "Địa chỉ đang cập nhật"}
                  orderDeadline={restaurant.orderDeadline}
                  distance={restaurant.distance}
                  deliveryTime={restaurant.deliveryTime}
                  promo={restaurant.freeship ? "Freeship" : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có quán ăn nào
              </h3>
              <p className="text-gray-500 mb-6">
                Hãy là người đầu tiên thêm quán ăn vào hệ thống!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm quán ăn đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Restaurant Form Modal */}
      <CreateRestaurantForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateRestaurant}
        isSubmitting={isSubmitting}
      />
    </AuthGuard>
  );
}
