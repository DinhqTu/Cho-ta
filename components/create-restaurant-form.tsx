"use client";

import React, { useState } from "react";
import { X, Upload, MapPin, Clock, Tag } from "lucide-react";

interface CreateRestaurantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (restaurant: RestaurantFormData) => void;
  isSubmitting?: boolean;
}

export interface RestaurantFormData {
  name: string;
  address?: string;
  image?: string;
  description?: string;
  orderDeadline: string;
  distance?: string;
  deliveryTime?: string;
  freeship: boolean;
  menuType: "static" | "dynamic";
}

export function CreateRestaurantForm({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateRestaurantFormProps) {
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: "",
    address: "",
    image: "",
    description: "",
    orderDeadline: "",
    distance: "",
    deliveryTime: "",
    freeship: false,
    menuType: "static",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: target.type === "checkbox" ? target.checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E9D7B8]">
        {/* Header */}
        <div className="p-6 border-b border-[#E9D7B8]/30 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2A2A2A]">Thêm quán ăn mới</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#2A2A2A] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              Thông tin cơ bản
            </h3>

            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                Tên quán *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Nhập tên quán ăn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                Địa chỉ *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Nhập địa chỉ quán ăn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                Loại menu *
              </label>
              <select
                name="menuType"
                value={formData.menuType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="static">Cố định</option>
                <option value="dynamic">Thay đổi hàng ngày</option>
              </select>
              <p className="text-xs text-[#2A2A2A]/50 mt-1">
                Menu tĩnh: thực đơn cố định. Menu động: thay đổi theo ngày.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                placeholder="Mô tả về quán ăn..."
              />
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#2A2A2A] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#D4AF37]" />
              Thông tin giao hàng
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                  Hạn chốt đơn *
                </label>
                <input
                  type="time"
                  name="orderDeadline"
                  value={formData.orderDeadline}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                  Khoảng cách
                </label>
                <input
                  type="text"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="1.5 km"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                  Thời gian giao
                </label>
                <input
                  type="text"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="15-25 ph"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#2A2A2A]/70 mb-2">
                <input
                  type="checkbox"
                  name="freeship"
                  checked={formData.freeship}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#D4AF37] border-[#E9D7B8] rounded focus:ring-[#D4AF37]"
                />
                Freeship
              </label>
              <p className="text-xs text-[#2A2A2A]/50">
                Khách hàng được miễn phí vận chuyển khi đặt món tại quán
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#2A2A2A] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#D4AF37]" />
              Hình ảnh
            </h3>

            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-2">
                URL hình ảnh
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="https://example.com/image.jpg (không bắt buộc)"
              />
            </div>
          </div>

          {/* Admin Note */}
          <div className="p-4 rounded-xl bg-[#FBF8F4] border border-[#E9D7B8]/30">
            <p className="text-sm text-[#2A2A2A]/70">
              <strong>Lưu ý:</strong> Quán ăn sẽ được hiển thị sau khi được
              admin duyệt. Quản trị viên sẽ xem xét và phê duyệt trong thời gian
              sớm nhất.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E9D7B8] text-[#2A2A2A] font-medium hover:bg-[#FBF8F4] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
