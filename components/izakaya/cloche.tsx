"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ClocheProps {
  isVisible: boolean;
  isOpen: boolean;
  onClick: () => void;
}

export function Cloche({ isVisible, isOpen, onClick }: ClocheProps) {
  const [isRattling, setIsRattling] = useState(false);

  useEffect(() => {
    if (!isVisible || isOpen) return;

    const interval = setInterval(() => {
      setIsRattling(true);
      setTimeout(() => setIsRattling(false), 800);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible, isOpen]);

  if (!isVisible) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-500",
        "w-48 h-48 md:w-80 md:h-80",
        isRattling && !isOpen && "animate-cloche-rattle"
      )}
      role="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Base plate */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-6 md:h-8">
        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#C0C0C0] via-[#E8E8E8] to-[#A0A0A0] shadow-lg" />
        <div className="absolute top-1 left-[5%] right-[5%] h-1 rounded-full bg-white/40" />
      </div>

      {/* Cloche lid */}
      <div
        className={cn(
          "absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[85%] transition-all origin-bottom",
          isOpen ? "opacity-0 -translate-y-20 rotate-[-30deg]" : "opacity-100"
        )}
        style={{
          transitionDuration: "700ms",
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Dome */}
        <div className="relative w-full aspect-[1/0.7]">
          <div
            className="absolute inset-0 rounded-t-full bg-gradient-to-br from-[#D4D4D4] via-[#F5F5F5] to-[#B0B0B0]"
            style={{
              boxShadow:
                "inset -10px -10px 30px rgba(0,0,0,0.1), inset 10px 10px 30px rgba(255,255,255,0.5)",
            }}
          />
          {/* Rim highlight */}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-transparent via-white/60 to-[#C0C0C0]" />
          {/* Top reflection */}
          <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/30 rounded-full blur-sm" />
        </div>

        {/* Handle */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-6 md:w-10 md:h-7">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#E0E0E0] via-[#C0C0C0] to-[#A0A0A0] shadow-md" />
          <div className="absolute top-1 left-[15%] right-[15%] h-1.5 rounded-full bg-white/50" />
        </div>
      </div>

      {/* Steam effect when opening */}
      {isOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-8 bg-white/20 rounded-full blur-sm animate-steam"
              style={{
                left: `${(i - 2) * 15}px`,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Click hint */}
      {!isOpen && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[#2A2A2A]/60 text-sm tracking-wide animate-pulse">
            tap to reveal
          </span>
        </div>
      )}
    </div>
  );
}
