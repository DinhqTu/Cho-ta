"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  getRestaurant,
  updateRestaurant,
  RestaurantDoc,
} from "@/lib/api/restaurants";
import {
  fetchMenuItemsForRestaurant,
  createDailyMenu,
  getDailyMenusWithDetails,
  updateDailyMenu,
  createMenuItemForAdmin,
  updateMenuItemApi,
  deleteMenuItemApi,
  MenuItemDoc,
} from "@/lib/api/menu";
import { toast } from "sonner";
import { categoryEmoji, menuCategories } from "@/lib/menu-store";
import { formatMoney } from "@/lib/utils";
import { MenuItemFormModal } from "@/components/menu-item-form";
import { MenuItemCard } from "@/components/menu-item-card";
import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  Store,
  UtensilsCrossed,
  Settings,
  Loader2,
  Search,
  SquareMenu,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface RestaurantFormData {
  name: string;
  description: string;
  address: string;
  orderDeadline: string;
  distance: string;
  deliveryTime: string;
  freeship: boolean;
  menuType: "static" | "dynamic"; // static: cố định, dynamic: theo ngày
}

export default function RestaurantManagePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const restaurantId = params["restaurant-id"] as string;

  const [restaurant, setRestaurant] = useState<RestaurantDoc | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemDoc[]>([]); // All available menu items for restaurant
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]); // IDs of items in current daily menu
  const [dailyMenuId, setDailyMenuId] = useState<string | null>(null); // Current daily menu document ID
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dishes" | "menu" | "info">(
    "menu",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
  });

  const [restaurantForm, setRestaurantForm] = useState<RestaurantFormData>({
    name: "",
    description: "",
    address: "",
    orderDeadline: "",
    distance: "",
    deliveryTime: "",
    freeship: false,
    menuType: "static",
  });

  // Check if user is the creator of this restaurant
  const isCreator =
    restaurant && user ? restaurant.createdBy === user.$id : false;

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      // Fetch restaurant info
      const restaurantData = await getRestaurant(restaurantId);
      if (restaurantData) {
        setRestaurant(restaurantData);
        setRestaurantForm({
          name: restaurantData.name,
          description: restaurantData.description || "",
          address: restaurantData.address || "",
          orderDeadline: restaurantData.orderDeadline || "",
          distance: restaurantData.distance || "",
          deliveryTime: restaurantData.deliveryTime || "",
          freeship: restaurantData.freeship || false,
          menuType: (restaurantData as any).menuType || "static",
        });
      }

      // Fetch menu items for this restaurant
      const menuData = await fetchMenuItemsForRestaurant(restaurantId);
      setMenuItems(menuData);

      // Fetch current daily menu for today with full details
      const today = new Date().toISOString().split("T")[0];
      const menuType = restaurantData?.menuType || "static";

      let dailyMenus = [];

      if (menuType === "static") {
        // For static menus, find by restaurantId and menuType only
        dailyMenus = await getDailyMenusWithDetails(
          restaurantId,
          undefined,
          "static",
        );
      } else {
        // For dynamic menus, find by restaurantId, menuType and date
        dailyMenus = await getDailyMenusWithDetails(
          restaurantId,
          today,
          "dynamic",
        );
      }
      if (dailyMenus.length > 0) {
        setDailyMenuId(dailyMenus[0].$id);

        // Use menuItem relationship - ensure we only store IDs
        const menuItemData = dailyMenus[0].menuItem || [];

        // Extract only IDs from menuItem data
        const menuItemIds = Array.isArray(menuItemData)
          ? menuItemData.map((item: any) => {
              // If it's an object with $id, extract $id
              if (item && typeof item === "object" && item.$id) {
                return item.$id;
              }
              // If it's already a string, use as is
              if (typeof item === "string") {
                return item;
              }
              // Fallback: convert to string
              return String(item);
            })
          : [];

        setSelectedMenuIds(menuItemIds);
      } else {
        setDailyMenuId(null);
        setSelectedMenuIds([]);
      }
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast.error("Không thể tải dữ liệu quán ăn");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (data: Omit<MenuItem, "id">) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const newItem = await createMenuItemForAdmin(data, restaurantId);
      if (newItem) {
        setMenuItems((prev) => [...prev, newItem]);
        setShowForm(false);
        toast.success("Đã thêm món ăn thành công");
      } else {
        setError("Không thể tạo món ăn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error creating menu item:", err);
      setError("Không thể tạo món ăn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMenuItem = async (data: Omit<MenuItem, "id">) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const success = await updateMenuItemApi(editingItem.id, data);
      if (success) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item.$id === editingItem.id
              ? ({ ...item, ...data } as MenuItemDoc)
              : item,
          ),
        );
        setEditingItem(null);
        toast.success("Đã cập nhật món ăn thành công");
      } else {
        setError("Không thể cập nhật món ăn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error updating menu item:", err);
      setError("Không thể cập nhật món ăn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    setIsDeleting(id);
    setError(null);
    try {
      const success = await deleteMenuItemApi(id);
      if (success) {
        setMenuItems((prev) => prev.filter((item) => item.$id !== id));
        toast.success("Đã xóa món ăn thành công");
      } else {
        setError("Không thể xóa món ăn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError("Không thể xóa món ăn. Vui lòng thử lại.");
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const handleUpdateRestaurant = async () => {
    setIsSubmitting(true);
    try {
      const success = await updateRestaurant(restaurantId, restaurantForm);
      if (success) {
        toast.success("Đã cập nhật thông tin quán ăn");
        fetchRestaurantData();
      }
    } catch (error) {
      toast.error("Không thể cập nhật thông tin quán ăn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRestaurantMenu = async () => {
    setIsSubmitting(true);
    try {
      // Get restaurant menu type
      const menuType = restaurantForm.menuType || "static";

      let success = false;

      if (dailyMenuId) {
        // Update existing daily menu
        success = await updateDailyMenu(
          dailyMenuId!,
          selectedMenuIds,
          menuType,
        );
      } else {
        // Create new daily menu
        success = await createDailyMenu(
          restaurantId,
          selectedMenuIds,
          menuType,
        );
      }

      if (success) {
        // Refresh daily menu data
        const today = new Date().toISOString().split("T")[0];
        const menuType = restaurantForm.menuType || "static";

        let dailyMenus = [];
        if (menuType === "static") {
          dailyMenus = await getDailyMenusWithDetails(
            restaurantId,
            undefined,
            "static",
          );
        } else {
          dailyMenus = await getDailyMenusWithDetails(
            restaurantId,
            today,
            "dynamic",
          );
        }

        if (dailyMenus.length > 0) {
          setDailyMenuId(dailyMenus[0].$id);

          // Update selectedMenuIds with the latest data - extract only IDs
          const menuItemData = dailyMenus[0].menuItem || [];

          const menuItemIds = Array.isArray(menuItemData)
            ? menuItemData.map((item: any) => {
                if (item && typeof item === "object" && item.$id) {
                  return item.$id;
                }
                if (typeof item === "string") {
                  return item;
                }
                return String(item);
              })
            : [];

          setSelectedMenuIds(menuItemIds);
        } else {
          setDailyMenuId(null);
          setSelectedMenuIds([]);
        }

        toast.success("Đã lưu thực đơn quán ăn");
      } else {
        toast.error("Không thể lưu thực đơn");
      }
    } catch (error) {
      console.error("Error saving restaurant menu:", error);
      toast.error("Không thể lưu thực đơn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditItem = (item: MenuItemDoc) => {
    setEditingItem({
      id: item.$id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setMenuItemForm({
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
    });
    setShowForm(false);
  };

  // Group by category
  const groupedItems = menuItems.reduce(
    (groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, MenuItemDoc[]>,
  );

  // Computed property: Get selected menu items details
  const selectedMenuItems = menuItems.filter((item) =>
    selectedMenuIds.includes(item.$id),
  );

  // Filter menu items for search and category
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      debouncedSearchQuery === "" ||
      item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.description
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredGroupedItems = filteredMenuItems.reduce(
    (groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, MenuItemDoc[]>,
  );

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!restaurant) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Không tìm thấy quán ăn
            </h1>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Check if user is the creator
  if (!isCreator) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Truy cập bị từ chối
            </h1>
            <p className="text-gray-600 mb-4">
              Bạn không có quyền quản lý quán ăn này.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {restaurant.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Quản lý quán ăn và thực đơn
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-8">
              {isCreator && (
                <button
                  onClick={() => setActiveTab("menu")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "menu"
                      ? "border-[#D4AF37] text-[#D4AF37]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SquareMenu className="w-4 h-4" />
                    Thực đơn
                  </div>
                </button>
              )}
              <button
                onClick={() => setActiveTab("dishes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "dishes"
                    ? "border-[#D4AF37] text-[#D4AF37]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  Món ăn
                </div>
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "info"
                    ? "border-[#D4AF37] text-[#D4AF37]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Thông tin quán
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Dishes Tab */}
          {activeTab === "dishes" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Quản lý món ăn
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Thêm, chỉnh sửa và quản lý tất cả món ăn trong hệ thống
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm món ăn
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  {error}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-2xl font-bold text-gray-900">
                    {menuItems.length}
                  </span>
                  <span className="text-gray-600">món ăn</span>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-600">
                  {Object.keys(groupedItems).length} danh mục
                </div>
              </div>

              {/* Menu Items by Category - 3 Column Layout */}
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">
                        {categoryEmoji[category] || "📍"}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {items.length} món
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.$id}
                          item={{
                            id: item.$id,
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            category: item.category,
                            image: item.image,
                          }}
                          onEdit={() =>
                            setEditingItem({
                              id: item.$id,
                              name: item.name,
                              description: item.description,
                              price: item.price,
                              category: item.category,
                              image: item.image,
                            })
                          }
                          onDelete={() => setDeleteConfirm(item.$id)}
                          isDeleting={isDeleting === item.$id}
                          layout="card"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {menuItems.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có món ăn nào
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Thêm món ăn đầu tiên để bắt đầu quản lý
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
                  >
                    Thêm món ăn
                  </button>
                </div>
              )}

              {/* Add/Edit Modal */}
              <MenuItemFormModal
                isOpen={showForm || !!editingItem}
                item={editingItem || undefined}
                onSave={editingItem ? handleUpdateMenuItem : handleAddMenuItem}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                isSaving={isSubmitting}
                restaurantId={restaurantId}
              />

              {/* Delete Confirmation */}
              {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Xóa món ăn?
                    </h2>
                    <p className="text-gray-600 mb-5">
                      Hành động này không thể hoàn tác.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={isDeleting !== null}
                        className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(deleteConfirm)}
                        disabled={isDeleting !== null}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDeleting === deleteConfirm ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu Tab - Restaurant Menu Selection */}
          {activeTab === "menu" && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Thực đơn quán
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Lựa chọn các món ăn sẽ hiển thị trong thực đơn của quán
                  </p>
                </div>
              </div>

              {menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có món ăn nào
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Vui lòng thêm món ăn trong tab "Món ăn" trước
                  </p>
                  <button
                    onClick={() => setActiveTab("dishes")}
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors"
                  >
                    Thêm món ăn
                  </button>
                </div>
              ) : (
                <div className="flex gap-6">
                  {/* Left Column - Menu Items List (3/4) */}
                  <div className="flex-1 space-y-4">
                    {/* Search and Filter */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Tìm kiếm món ăn..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">Tất cả danh mục</option>
                        {menuCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {categoryEmoji[cat] || "📍"} {cat}
                          </option>
                        ))}
                      </select>
                      {(debouncedSearchQuery || selectedCategory) && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("");
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>

                    {/* Search Results Info */}
                    {(debouncedSearchQuery || selectedCategory) && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          {debouncedSearchQuery && (
                            <span>
                              Tìm kiếm:{" "}
                              <strong>"{debouncedSearchQuery}"</strong>
                            </span>
                          )}
                          {debouncedSearchQuery && selectedCategory && (
                            <span className="mx-2">•</span>
                          )}
                          {selectedCategory && (
                            <span>
                              Danh mục: <strong>{selectedCategory}</strong>
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {filteredMenuItems.length} kết quả
                        </div>
                      </div>
                    )}

                    {/* Menu Items Grid */}
                    {filteredMenuItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không tìm thấy món ăn nào
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {debouncedSearchQuery &&
                            "Thử tìm kiếm với từ khóa khác"}
                          {selectedCategory && "Thử chọn danh mục khác"}
                          {debouncedSearchQuery &&
                            selectedCategory &&
                            "Thử điều chỉnh bộ lọc"}
                        </p>
                        {(debouncedSearchQuery || selectedCategory) && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategory("");
                            }}
                            className="px-4 py-2 text-[#D4AF37] hover:text-[#C5A028] font-medium"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMenuItems.map((item) => {
                          const isSelected = selectedMenuIds.includes(item.$id);
                          return (
                            <MenuItemCard
                              key={item.$id}
                              item={{
                                id: item.$id,
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                category: item.category,
                                image: item.image,
                              }}
                              isSelected={isSelected}
                              isSelectable={true}
                              onSelect={() => {
                                if (isSelected) {
                                  setSelectedMenuIds(
                                    selectedMenuIds.filter(
                                      (id) => id !== item.$id,
                                    ),
                                  );
                                } else {
                                  setSelectedMenuIds([
                                    ...selectedMenuIds,
                                    item.$id,
                                  ]);
                                }
                              }}
                              layout="card"
                              showActions={false}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Selected Items (1/4) */}
                  <div className="w-1/4 min-w-[300px]">
                    <div className="bg-[#F8F4EE] rounded-xl p-4 sticky top-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Thực đơn
                        </h3>
                        {selectedMenuIds.length > 0 && (
                          <button
                            onClick={() => setSelectedMenuIds([])}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Xóa tất cả
                          </button>
                        )}
                      </div>

                      {selectedMenuIds.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UtensilsCrossed className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">
                            Chưa chọn món nào
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {selectedMenuItems.map((item) => {
                              if (!item) return null;
                              return (
                                <div
                                  key={item.$id}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg text-sm group"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="shrink-0">
                                      {categoryEmoji[item.category] || "📍"}
                                    </span>
                                    <span className="truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-medium text-[#D4AF37] text-xs">
                                      {formatMoney(item.price)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMenuIds(
                                          selectedMenuIds.filter(
                                            (id) => id !== item.$id,
                                          ),
                                        );
                                      }}
                                      className="text-red-500 hidden group-hover:block hover:text-red-700 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#E9D7B8]/50">
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-semibold text-gray-900">
                                Tổng cộng:
                              </span>
                              <span className="text-lg font-bold text-[#D4AF37]">
                                {selectedMenuItems.length} món
                              </span>
                            </div>

                            {/* Save Menu Button - Moved here */}
                            <div className="space-y-3">
                              <button
                                onClick={handleSaveRestaurantMenu}
                                disabled={isSubmitting}
                                className="w-full px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Đang lưu...</span>
                                  </>
                                ) : dailyMenuId ? (
                                  "Cập nhật thực đơn"
                                ) : (
                                  "Lưu thực đơn"
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === "info" && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Thông tin quán ăn
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên quán ăn
                    </label>
                    <input
                      type="text"
                      value={restaurantForm.name}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={restaurantForm.address}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian chốt đơn
                    </label>
                    <input
                      type="text"
                      value={restaurantForm.orderDeadline}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          orderDeadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      placeholder="VD: 11:30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian giao hàng
                    </label>
                    <input
                      type="text"
                      value={restaurantForm.deliveryTime}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          deliveryTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      placeholder="VD: 15-25 ph"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khoảng cách
                    </label>
                    <input
                      type="text"
                      value={restaurantForm.distance}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          distance: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      placeholder="VD: 1.5 km"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="freeship"
                      checked={restaurantForm.freeship}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          freeship: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <label
                      htmlFor="freeship"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Freeship
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={restaurantForm.description}
                      onChange={(e) =>
                        setRestaurantForm({
                          ...restaurantForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Menu Type Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Loại menu
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="static"
                        name="menuType"
                        value="static"
                        checked={restaurantForm.menuType === "static"}
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            menuType: "static",
                          })
                        }
                        className="w-4 h-4 text-[#D4AF37] border-gray-300 focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="static" className="ml-3">
                        <div className="flex items-center">
                          <Store className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">
                              Menu cố định
                            </div>
                            <div className="text-sm text-gray-500">
                              Thực đơn không thay đổi theo ngày
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="dynamic"
                        name="menuType"
                        value="dynamic"
                        checked={restaurantForm.menuType === "dynamic"}
                        onChange={(e) =>
                          setRestaurantForm({
                            ...restaurantForm,
                            menuType: "dynamic",
                          })
                        }
                        className="w-4 h-4 text-[#D4AF37] border-gray-300 focus:ring-[#D4AF37]"
                      />
                      <label htmlFor="dynamic" className="ml-3">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">
                              Menu động
                            </div>
                            <div className="text-sm text-gray-500">
                              Thực đơn thay đổi theo ngày trong tuần
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleUpdateRestaurant}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
