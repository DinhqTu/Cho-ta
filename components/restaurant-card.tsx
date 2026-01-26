"use client";

import React from "react";
import { Star, Clock, MapPin, Tag } from "lucide-react";
import { generateRestaurantSlug } from "@/lib/api/restaurants";

interface RestaurantCardProps {
  image: string;
  name: string;
  address: string;
  promo?: string;
  orderDeadline?: string; // Format: "HH:mm" (e.g., "11:30")
  distance?: string;
  deliveryTime?: string;
}

export function RestaurantCard({
  image,
  name,
  address,
  promo,
  orderDeadline,
  distance,
  deliveryTime,
}: RestaurantCardProps) {
  const handleClick = () => {
    // Generate slug and navigate to restaurant detail page
    const slug = generateRestaurantSlug(name);

    window.location.href = `/${slug}`;
  };
  // Calculate restaurant status based on order deadline
  const getRestaurantStatus = () => {
    if (!orderDeadline) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    const [hours, minutes] = orderDeadline.split(":").map(Number);
    const deadlineTime = hours * 60 + minutes; // Deadline time in minutes

    const timeUntilDeadline = deadlineTime - currentTime;

    if (timeUntilDeadline <= 0) {
      return {
        text: "Đã đóng cửa",
        className: "bg-red-500 text-white",
        isClosed: true,
      };
    } else if (timeUntilDeadline <= 5) {
      return {
        text: `Đóng cửa trong ${timeUntilDeadline} phút nữa`,
        className: "bg-orange-500 text-white",
        isClosed: false,
      };
    } else if (timeUntilDeadline <= 30) {
      return {
        text: `Đóng cửa trong ${timeUntilDeadline} phút nữa`,
        className: "bg-yellow-500 text-white",
        isClosed: false,
      };
    } else {
      return {
        text: "Đang mở cửa",
        className: "bg-green-500 text-white",
        isClosed: false,
      };
    }
  };

  const status = getRestaurantStatus();
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Promo Badge */}
        {promo && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {promo}
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
          >
            {status.text}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Restaurant Name */}
        <h3 className="font-bold text-lg text-[#2A2A2A] mb-1 group-hover:text-[#D4AF37] transition-colors">
          {name}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-1 text-sm text-[#2A2A2A]/60 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{address}</span>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-4 pt-3 border-t border-[#E9D7B8]/30 text-sm text-[#2A2A2A]/70">
          {distance && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{distance}</span>
            </div>
          )}
          {deliveryTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{deliveryTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
