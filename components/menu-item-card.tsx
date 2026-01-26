"use client";

import React from "react";
import { categoryEmoji } from "@/lib/menu-store";
import { MenuItem } from "@/lib/menu-data";
import { formatMoney } from "@/lib/utils";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  isDeleting?: boolean;
  layout?: "card" | "list" | "compact";
  showActions?: boolean;
  className?: string;
}

export function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  isSelectable = false,
  isDeleting = false,
  layout = "card",
  showActions = true,
  className = "",
}: MenuItemCardProps) {
  const baseClasses = "bg-white border rounded-xl transition-all duration-200";
  const layoutClasses = {
    card: "p-4 hover:shadow-lg group",
    list: "flex items-center gap-4 p-4 hover:border-gray-300",
    compact: "p-3 hover:border-gray-300",
  };

  const selectedClasses = isSelected
    ? "border-[#D4AF37] bg-[#D4AF37]/5"
    : "border-gray-200";

  const clickableClasses = isSelectable
    ? "cursor-pointer hover:border-[#D4AF37]/50"
    : "";

  const combinedClasses = `${baseClasses} ${layoutClasses[layout]} ${selectedClasses} ${clickableClasses} ${className}`;

  const handleCardClick = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  if (layout === "list") {
    return (
      <div className={combinedClasses} onClick={handleCardClick}>
        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
          <span className="text-2xl">
            {categoryEmoji[item.category] || "📍"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {item.name}
            </h3>
            {isSelectable && (
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-[#D4AF37] bg-[#D4AF37]"
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-[#D4AF37]">
              {formatMoney(item.price)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[#FBF8F4] text-gray-600">
              {item.category}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className={combinedClasses} onClick={handleCardClick}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
            <span className="text-xl">
              {categoryEmoji[item.category] || "📍"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#D4AF37]">
                  {formatMoney(item.price)}
                </span>
                {isSelectable && (
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card layout
  return (
    <div className={combinedClasses} onClick={handleCardClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border border-[#E9D7B8]/30 shrink-0">
          <span className="text-2xl">
            {categoryEmoji[item.category] || "📍"}
          </span>
        </div>

        <div className="flex gap-1">
          {showActions && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {showActions && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-500" />
              )}
            </button>
          )}
          {isSelectable && (
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-gray-300"
              }`}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 group-hover:text-[#D4AF37] transition-colors">
          {item.name}
        </h4>
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-[#D4AF37]">
            {formatMoney(item.price)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-[#FBF8F4] text-gray-600">
            {item.category}
          </span>
        </div>
      </div>
    </div>
  );
}
