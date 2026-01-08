"use client";

import { useEffect, useState } from "react";
import { cn, formatMoney } from "@/lib/utils";
import { MenuItem, restaurant } from "@/lib/menu-data";

const categoryEmoji: Record<string, string> = {
  Cá: "🐟",
  "Thịt heo": "🐖",
  "Thịt bò": "🐄",
  "Thịt gà": "🐓",
  "Thịt vịt": "🪿",
  Trứng: "🥚",
  Ếch: "🐸",
  "Rau củ": "🥬",
  "Đậu hũ": "🧈",
  Canh: "🍲",
  Cơm: "🍚",
  "Món khác": "🍽️",
};

interface MenuCardProps {
  isVisible: boolean;
  isDocked: boolean;
  items: MenuItem[];
  onContinue: () => void;
  isFirstOpen: boolean;
}

// Floating particle component
function Particle({
  delay,
  position,
}: {
  delay: number;
  position: { x: string; y: string };
}) {
  return (
    <div
      className={cn(
        "absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400",
        delay % 2 === 0 ? "animate-particle" : "animate-particle-alt"
      )}
      style={{
        left: position.x,
        top: position.y,
        animationDelay: `${delay * 400}ms`,
      }}
    />
  );
}

export function MenuCard({
  isVisible,
  isDocked,
  items,
  onContinue,
  isFirstOpen,
}: MenuCardProps) {
  const [showParticles, setShowParticles] = useState(false);
  const [showLightBurst, setShowLightBurst] = useState(false);

  useEffect(() => {
    if (isVisible && !isDocked) {
      setShowLightBurst(true);
      const timer = setTimeout(() => {
        setShowParticles(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowParticles(false);
      setShowLightBurst(false);
    }
  }, [isVisible, isDocked]);

  if (!isVisible) return null;

  // Group items by category
  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Particle positions around the card border
  const particlePositions = [
    { x: "10%", y: "-5px" },
    { x: "30%", y: "-5px" },
    { x: "50%", y: "-5px" },
    { x: "70%", y: "-5px" },
    { x: "90%", y: "-5px" },
    { x: "10%", y: "calc(100% + 5px)" },
    { x: "30%", y: "calc(100% + 5px)" },
    { x: "50%", y: "calc(100% + 5px)" },
    { x: "70%", y: "calc(100% + 5px)" },
    { x: "90%", y: "calc(100% + 5px)" },
    { x: "-5px", y: "20%" },
    { x: "-5px", y: "50%" },
    { x: "-5px", y: "80%" },
    { x: "calc(100% + 5px)", y: "20%" },
    { x: "calc(100% + 5px)", y: "50%" },
    { x: "calc(100% + 5px)", y: "80%" },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {!isDocked && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[8px] animate-overlay-fade" />
      )}

      {/* Light burst effect - behind menu */}
      {!isDocked && showLightBurst && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-none">
          {/* Radial glow */}
          <div
            className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full animate-light-burst"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(255,215,0,0.3) 30%, transparent 70%)",
            }}
          />
          {/* Light rays */}
          <div
            className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 animate-light-rays"
            style={{
              background: `
                conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  rgba(255,215,0,0.3) 10deg,
                  transparent 20deg,
                  transparent 30deg,
                  rgba(255,215,0,0.2) 40deg,
                  transparent 50deg,
                  transparent 60deg,
                  rgba(255,215,0,0.3) 70deg,
                  transparent 80deg,
                  transparent 90deg,
                  rgba(255,215,0,0.2) 100deg,
                  transparent 110deg,
                  transparent 120deg,
                  rgba(255,215,0,0.3) 130deg,
                  transparent 140deg,
                  transparent 150deg,
                  rgba(255,215,0,0.2) 160deg,
                  transparent 170deg,
                  transparent 180deg,
                  rgba(255,215,0,0.3) 190deg,
                  transparent 200deg,
                  transparent 210deg,
                  rgba(255,215,0,0.2) 220deg,
                  transparent 230deg,
                  transparent 240deg,
                  rgba(255,215,0,0.3) 250deg,
                  transparent 260deg,
                  transparent 270deg,
                  rgba(255,215,0,0.2) 280deg,
                  transparent 290deg,
                  transparent 300deg,
                  rgba(255,215,0,0.3) 310deg,
                  transparent 320deg,
                  transparent 330deg,
                  rgba(255,215,0,0.2) 340deg,
                  transparent 350deg,
                  transparent 360deg
                )
              `,
            }}
          />
        </div>
      )}

      {/* Menu Card */}
      <div
        className={cn(
          "fixed z-40 transition-all",
          isDocked
            ? "hidden"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md"
        )}
        style={{
          transitionDuration: "550ms",
          transitionTimingFunction: "ease-in-out",
        }}
        role="dialog"
        aria-label="Restaurant menu"
      >
        <div
          className={cn(
            "relative bg-white overflow-hidden",
            "border-2 border-[#D4AF37]/50",
            isDocked ? "rounded-xl" : "rounded-[14px]",
            !isDocked &&
              (isFirstOpen
                ? "animate-menu-reveal"
                : "animate-menu-reveal-soft"),
            !isDocked && "animate-neon-flicker"
          )}
          style={{
            boxShadow: isDocked
              ? "0 4px 20px rgba(0,0,0,0.12)"
              : "0 20px 60px rgba(0,0,0,0.28), 0 0 40px rgba(212,175,55,0.2)",
          }}
        >
          {/* Shimmer border overlay */}
          {!isDocked && (
            <div className="absolute inset-0 rounded-[14px] pointer-events-none overflow-hidden">
              <div className="absolute inset-[-2px] rounded-[16px] animate-border-shimmer opacity-70" />
            </div>
          )}

          {/* Floating particles */}
          {!isDocked && showParticles && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {particlePositions.map((pos, i) => (
                <Particle key={i} delay={i} position={pos} />
              ))}
            </div>
          )}

          {/* Header */}
          <div
            className={cn(
              "relative p-6 border-b border-[#E9D7B8]/50 bg-gradient-to-b from-[#FBF8F4] to-white",
              isDocked && "p-4"
            )}
          >
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/logo_batcomman.jpg"
                alt="Bát Cơm Mặn"
                className={cn(
                  "rounded-full object-cover",
                  isDocked ? "w-10 h-10" : "w-14 h-14"
                )}
              />
              <div>
                <h2
                  className={cn(
                    "font-semibold text-[#2A2A2A]",
                    isDocked ? "text-lg" : "text-xl"
                  )}
                >
                  {restaurant.name}
                </h2>
                {!isDocked && (
                  <p className="text-sm text-[#2A2A2A]/50 mt-0.5">VTCode</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items - View Only */}
          {!isDocked && (
            <div
              className={cn(
                "overflow-y-auto",
                isDocked ? "max-h-28 p-3" : "max-h-[55vh] p-5"
              )}
            >
              {items.length === 0 ? (
                /* Empty State - No Menu Available */
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  {/* Animated Icon */}
                  <div className="relative mb-6">
                    {/* Pulsing background glow */}
                    <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-2xl animate-pulse" />

                    {/* Icon container */}
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center border-2 border-[#E9D7B8]/50 shadow-lg">
                      <span
                        className="text-5xl animate-bounce"
                        style={{ animationDuration: "2s" }}
                      >
                        📋
                      </span>
                    </div>

                    {/* Decorative particles */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#D4AF37] rounded-full animate-ping opacity-50" />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping opacity-30"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>

                  {/* Message */}
                  <h3 className="text-xl font-bold text-[#2A2A2A] mb-2 text-center">
                    Chưa có menu hôm nay
                  </h3>
                  <p className="text-sm text-[#2A2A2A]/60 text-center max-w-xs leading-relaxed mb-6">
                    Menu đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ
                    quản trị viên.
                  </p>

                  {/* Decorative divider */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                    <span className="text-2xl">✨</span>
                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                  </div>

                  {/* Status badge */}
                  <div className="px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Đang chờ cập nhật menu
                    </p>
                  </div>
                </div>
              ) : (
                /* Menu Items List */
                <div className="space-y-6">
                  {Object.entries(categories).map(
                    ([category, categoryItems]) => (
                      <div key={category}>
                        <h3 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-3">
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#FBF8F4] transition-colors duration-200"
                            >
                              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#FBF8F4] to-[#F5EDE3] flex items-center justify-center shrink-0 border border-[#E9D7B8]/30">
                                <span className="text-2xl">
                                  {categoryEmoji[item.category] || "🍽️"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4 className="font-medium text-[#2A2A2A]">
                                    {item.name}
                                  </h4>
                                  <span className="font-semibold text-[#D4AF37] whitespace-nowrap">
                                    {formatMoney(item.price)}
                                  </span>
                                </div>
                                <p className="text-sm text-[#2A2A2A]/50 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer with Continue button */}
          {!isDocked && (
            <div className="p-5 border-t border-dashed border-[#E9D7B8]/50 bg-[#FBF8F4]">
              <button
                onClick={onContinue}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white font-semibold hover:from-[#C5A028] hover:to-[#B8942A] transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Continue to Order
              </button>
              <p className="text-center text-xs text-[#2A2A2A]/40 mt-3">
                Chào mừng bạn · Welcome
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
