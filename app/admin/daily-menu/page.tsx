"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/utils";
import { AdminGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/auth-context";
import { MenuItem } from "@/lib/menu-data";
import { fetchMenuItems } from "@/lib/api/menu";
import {
  DailyMenuItem,
  DailyMenu,
  getDailyMenuByDate,
  createDailyMenu,
  removeItemFromDailyMenu,
  getTodayDate,
  formatDateDisplay,
} from "@/lib/api/daily-menu";
import {
  Plus,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Send,
  Search,
} from "lucide-react";
import {
  sendDailyMenuNotification,
  sendOrderDeadlineReminder,
} from "@/lib/vchat";
import { categoryEmoji } from "@/lib/menu-store";
import { Button } from "@/components/ui/button";

function DailyMenuContent() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isSendingDeadline, setIsSendingDeadline] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [menu, items] = await Promise.all([
        getDailyMenuByDate(selectedDate),
        fetchMenuItems(),
      ]);
      setDailyMenu(menu);
      setAllMenuItems(items);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Navigate dates
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  // Add item to daily menu
  const handleAddItem = async (item: MenuItem) => {
    if (!user) return;

    const dailyItem: DailyMenuItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
    };

    setIsSaving(true);
    try {
      const currentItems = dailyMenu?.menuItems || [];

      if (currentItems.length >= 6) {
        alert("Daily menu can have maximum 6 items");
        return;
      }

      if (currentItems.some((i) => i.id === item.id)) {
        alert("Item already in today's menu");
        return;
      }

      const updatedItems = [...currentItems, dailyItem];
      const result = await createDailyMenu(
        selectedDate,
        updatedItems,
        user.$id
      );

      if (result) {
        setDailyMenu(result);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove item from daily menu
  const handleRemoveItem = async (itemId: string) => {
    setIsSaving(true);
    try {
      const result = await removeItemFromDailyMenu(selectedDate, itemId);
      if (result) {
        setDailyMenu(result);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Available items (not in daily menu)
  const availableItems = allMenuItems.filter(
    (item) => !dailyMenu?.menuItems.some((di) => di.id === item.id)
  );

  // Filter items by search query and category
  const filteredItems = availableItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from available items
  const categories = Array.from(
    new Set(availableItems.map((item) => item.category))
  ).sort();

  const isToday = selectedDate === getTodayDate();

  // Send notification to Rocket Chat
  const handleSendNotification = async () => {
    if (!dailyMenu || dailyMenu.menuItems.length === 0) {
      alert("Chưa có món nào trong menu!");
      return;
    }

    setIsSendingNotification(true);
    try {
      const items = dailyMenu.menuItems.map((item) => ({
        name: item.name,
        price: item.price,
        category: item.category,
      }));

      const success = await sendDailyMenuNotification(items, selectedDate);

      if (success) {
        alert("Đã gửi thông báo menu lên VChat!");
      } else {
        alert("Gửi thông báo thất bại!");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Có lỗi xảy ra!");
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Send deadline reminder
  const handleSendDeadlineReminder = async () => {
    setIsSendingDeadline(true);
    try {
      const success = await sendOrderDeadlineReminder();

      if (success) {
        alert("Đã gửi thông báo nhắc chốt món lên VChat!");
      } else {
        alert("Gửi thông báo thất bại!");
      }
    } catch (error) {
      console.error("Error sending deadline reminder:", error);
      alert("Có lỗi xảy ra!");
    } finally {
      setIsSendingDeadline(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🏮</span>
          </div>
          <p className="text-[#2A2A2A]/50">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
      </div>

      {/* Date Navigation */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className="p-2 rounded-lg hover:bg-[#FBF8F4] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#2A2A2A]/70" />
            </button>

            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-lg font-bold text-[#2A2A2A] bg-transparent border-none focus:outline-none cursor-pointer"
                />
                <p className="text-sm text-[#2A2A2A]/50">
                  {formatDateDisplay(selectedDate)}
                </p>
              </div>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-medium hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg hover:bg-[#FBF8F4] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#2A2A2A]/70" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">Daily Menu</h1>
            <p className="text-[#2A2A2A]/50 text-sm mt-1">
              {dailyMenu?.menuItems.length || 0} / 6 dishes selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dailyMenu && dailyMenu.menuItems.length > 0 && (
              <>
                <Button
                  onClick={handleSendNotification}
                  disabled={isSendingNotification}
                >
                  <Send className="w-4 h-4" />
                  {isSendingNotification ? "Đang gửi..." : "Gửi Menu"}
                </Button>

                <Button
                  onClick={handleSendDeadlineReminder}
                  disabled={isSendingDeadline}
                  variant="destructive"
                >
                  ⏰ {isSendingDeadline ? "Đang gửi..." : "Nhắc chốt món"}
                </Button>
              </>
            )}

            {(dailyMenu?.menuItems.length || 0) < 6 && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#D4AF37] hover:bg-[#C5A028]"
              >
                <Plus className="w-4 h-4" />
                Add Dish
              </Button>
            )}
          </div>
        </div>

        {/* Daily Menu Items */}
        {dailyMenu && dailyMenu.menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyMenu.menuItems.map((item, index) => (
              <div
                key={item.id}
                className="relative bg-white rounded-2xl group border border-[#E9D7B8]/50 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                {/* Remove button */}
                <Button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={isSaving}
                  className="absolute top-3 hidden group-hover:flex right-3 w-8 h-8 rounded-full bg-red-500 text-white items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-md"
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Item number */}
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {index + 1}
                </div>

                <div className="p-6 pt-14">
                  <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30 mb-4">
                    <span className="text-5xl">
                      {categoryEmoji[item.category] || "📍"}
                    </span>
                  </div>
                  <h3 className="text-center font-semibold text-[#2A2A2A]">
                    {item.name}
                  </h3>
                  <p className="text-center text-sm text-[#2A2A2A]/50 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-center text-lg font-bold text-[#D4AF37] mt-2">
                    {formatMoney(item.price)}
                  </p>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 6 - dailyMenu.menuItems.length }).map(
              (_, i) => (
                <button
                  key={`empty-${i}`}
                  onClick={() => setShowAddModal(true)}
                  className="bg-white/50 rounded-2xl border-2 border-dashed border-[#E9D7B8] p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-[#D4AF37] hover:bg-white/80 transition-all"
                >
                  <Plus className="w-10 h-10 text-[#D4AF37]/50 mb-2" />
                  <span className="text-[#2A2A2A]/40 text-sm">Add dish</span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
              <span className="text-5xl">📋</span>
            </div>
            <p className="text-[#2A2A2A]/50 text-lg mb-4">
              No menu set for this date
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#D4AF37] hover:bg-[#C5A028] rounded-xl px-6"
              size="lg"
            >
              Create Menu
            </Button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-[#E9D7B8]">
            <div className="p-5 border-b border-[#E9D7B8]/30 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2A2A2A]">
                Add Dish to Menu
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="p-5 border-b border-[#E9D7B8]/20 bg-[#FBF8F4]/50 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2A2A2A]/40">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm món ăn..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A2A2A]/40 hover:text-[#2A2A2A] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCategory === "all"
                        ? "bg-[#D4AF37] text-white shadow-md"
                        : "bg-white text-[#2A2A2A]/70 border border-[#E9D7B8] hover:border-[#D4AF37]"
                    }`}
                  >
                    Tất cả ({availableItems.length})
                  </button>
                  {categories.map((category) => {
                    const count = availableItems.filter(
                      (item) => item.category === category
                    ).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                          selectedCategory === category
                            ? "bg-[#D4AF37] text-white shadow-md"
                            : "bg-white text-[#2A2A2A]/70 border border-[#E9D7B8] hover:border-[#D4AF37]"
                        }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 max-h-[50vh] overflow-y-auto">
              {filteredItems.length > 0 ? (
                <>
                  {/* Results count */}
                  <p className="text-xs text-[#2A2A2A]/50 mb-3">
                    Tìm thấy {filteredItems.length} món ăn
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        disabled={isSaving}
                        className="flex items-center gap-3 p-4 rounded-xl border border-[#E9D7B8]/50 hover:border-[#D4AF37] hover:bg-[#FBF8F4] transition-all text-left disabled:opacity-50"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center shrink-0">
                          <span className="text-2xl">
                            {categoryEmoji[item.category] || "📍"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#2A2A2A] truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#2A2A2A]/50 truncate">
                            {item.category}
                          </p>
                          <p className="text-sm text-[#D4AF37] font-medium mt-1">
                            {formatMoney(item.price)}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-[#D4AF37]" />
                      </button>
                    ))}
                  </div>
                </>
              ) : searchQuery || selectedCategory !== "all" ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FBF8F4] flex items-center justify-center mb-3">
                    <Search className="w-8 h-8 text-[#D4AF37]/50" />
                  </div>
                  <p className="text-[#2A2A2A]/50 mb-2">
                    Không tìm thấy món ăn
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="text-sm text-[#D4AF37] hover:underline"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#2A2A2A]/50">
                    All dishes are already in today's menu
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyMenuPage() {
  return (
    <AdminGuard>
      <Header />
      <div className="pt-16">
        <DailyMenuContent />
      </div>
    </AdminGuard>
  );
}
