"use client";

import { useState, useEffect } from "react";
import { cn, formatMoney } from "@/lib/utils";
import { MenuItem } from "@/lib/menu-data";
import {
  fetchMenuItems,
  createMenuItem,
  updateMenuItemApi,
  deleteMenuItemApi,
} from "@/lib/api/menu";
import { categoryEmoji, menuCategories } from "@/lib/menu-store";
import { AdminGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Save,
  Loader2,
} from "lucide-react";

// Menu item form
function MenuItemForm({
  item,
  onSave,
  onCancel,
  isSaving,
}: {
  item?: MenuItem;
  onSave: (data: Omit<MenuItem, "id">) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [category, setCategory] = useState(item?.category || menuCategories[0]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    onSave({
      name,
      description,
      price: parseFloat(price),
      category,
      image: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1">
          Dish Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Salmon Sashimi"
          className="w-full px-4 py-3 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
          required
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the dish..."
          className="w-full px-4 py-3 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none h-20"
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1">
            Price ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            disabled={isSaving}
          >
            {menuCategories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryEmoji[cat] || "📍"} {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {item ? "Update" : "Add Dish"}
        </button>
      </div>
    </form>
  );
}

// Menu item card
function MenuItemCard({
  item,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E9D7B8]/50 hover:border-[#D4AF37]/50 transition-colors",
        isDeleting && "opacity-50"
      )}
    >
      <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
        <span className="text-3xl">{categoryEmoji[item.category] || "📍"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#2A2A2A] truncate">{item.name}</h3>
        <p className="text-sm text-[#2A2A2A]/50 truncate">{item.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-[#D4AF37]">
            {formatMoney(item.price)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBF8F4] text-[#2A2A2A]/60">
            {item.category}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="w-10 h-10 rounded-lg bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors disabled:opacity-50"
        >
          <Pencil className="w-4 h-4 text-[#2A2A2A]/70" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-red-500" />
          )}
        </button>
      </div>
    </div>
  );
}

function AdminMenuContent() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMenuItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error("Error loading menu items:", err);
      setError("Failed to load menu items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const handleAdd = async (data: Omit<MenuItem, "id">) => {
    setIsSaving(true);
    setError(null);
    try {
      const newItem = await createMenuItem(data);
      if (newItem) {
        setMenuItems((prev) => [...prev, newItem]);
        setShowForm(false);
      } else {
        setError("Failed to create menu item. Please try again.");
      }
    } catch (err) {
      console.error("Error creating menu item:", err);
      setError("Failed to create menu item. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: Omit<MenuItem, "id">) => {
    if (!editingItem) return;
    setIsSaving(true);
    setError(null);
    try {
      const success = await updateMenuItemApi(editingItem.id, data);
      if (success) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...data } : item
          )
        );
        setEditingItem(null);
      } else {
        setError("Failed to update menu item. Please try again.");
      }
    } catch (err) {
      console.error("Error updating menu item:", err);
      setError("Failed to update menu item. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    setError(null);
    try {
      const success = await deleteMenuItemApi(id);
      if (success) {
        setMenuItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setError("Failed to delete menu item. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError("Failed to delete menu item. Please try again.");
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };

  // Group by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Loading menu items...</p>
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

      {/* Page Header */}
      <div className="relative z-10 px-6 py-4 border-b border-[#E9D7B8]/30 bg-white/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#2A2A2A]">Menu Management</h1>
          <button
            onClick={loadMenuItems}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#2A2A2A]/70 hover:text-[#2A2A2A] hover:bg-[#FBF8F4] transition-colors disabled:opacity-50"
            title="Refresh menu"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-[#D4AF37]">
              {menuItems.length}
            </span>
            <span className="text-[#2A2A2A]/60">dishes in menu</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Dish
          </button>
        </div>

        {/* Menu Items by Category */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>{categoryEmoji[category] || "📍"}</span>
                {category}
                <span className="text-[#2A2A2A]/40">({items.length})</span>
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => setDeleteConfirm(item.id)}
                    isDeleting={isDeleting === item.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#2A2A2A]/50 text-lg mb-4">No dishes yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
            >
              Add Your First Dish
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showForm || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-md p-6 shadow-2xl border border-[#E9D7B8]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-[#2A2A2A]">
                {editingItem ? "Edit Dish" : "Add New Dish"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                disabled={isSaving}
                className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MenuItemForm
              item={editingItem || undefined}
              onSave={editingItem ? handleUpdate : handleAdd}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl border border-[#E9D7B8]">
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-2">
              Delete Dish?
            </h2>
            <p className="text-[#2A2A2A]/60 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting !== null}
                className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting !== null}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting === deleteConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMenuPage() {
  return (
    <AdminGuard>
      <Header />
      <div className="pt-16">
        <AdminMenuContent />
      </div>
    </AdminGuard>
  );
}
