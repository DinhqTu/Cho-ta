"use client";

import React, { useState } from "react";
import { categoryEmoji, menuCategories } from "@/lib/menu-store";
import { MenuItem } from "@/lib/menu-data";
import { Save, X, Loader2 } from "lucide-react";

interface MenuItemFormProps {
  item?: MenuItem;
  onSave: (data: Omit<MenuItem, "id">) => void;
  onCancel: () => void;
  isSaving?: boolean;
  title?: string;
  saveButtonText?: string;
  restaurantId?: string;
}

export function MenuItemForm({
  item,
  onSave,
  onCancel,
  isSaving = false,
  title,
  saveButtonText,
  restaurantId,
}: MenuItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [category, setCategory] = useState(item?.category || menuCategories[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const formData = {
      name,
      description,
      price: parseFloat(price),
      category,
      image: "",
    };

    onSave(formData);
  };

  const defaultTitle = item ? "Chỉnh sửa món ăn" : "Thêm món ăn mới";
  const defaultSaveText = item ? "Cập nhật" : "Thêm món";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">
          {title || defaultTitle}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên món ăn *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Cơm gà chiên mắm"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors"
          required
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về món ăn..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors resize-none h-20"
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá (VNĐ) *
          </label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="50 = 50.0000 vnđ"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors"
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
          className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Hủy
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
          {saveButtonText || defaultSaveText}
        </button>
      </div>
    </form>
  );
}

// Modal wrapper for MenuItemForm
interface MenuItemFormModalProps extends MenuItemFormProps {
  isOpen: boolean;
}

export function MenuItemFormModal({
  isOpen,
  ...formProps
}: MenuItemFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[90%] max-w-md p-6 shadow-2xl border border-gray-200">
        <MenuItemForm {...formProps} />
      </div>
    </div>
  );
}
