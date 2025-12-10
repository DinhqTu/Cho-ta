"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CurtainsProps {
  isOpen: boolean;
  onClick: () => void;
}

export function Curtains({ isOpen, onClick }: CurtainsProps) {
  const [isRattling, setIsRattling] = useState(false);

  useEffect(() => {
    if (isOpen) return;

    const interval = setInterval(() => {
      setIsRattling(true);
      setTimeout(() => setIsRattling(false), 600);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <>
      {/* Left Curtain */}
      <div
        onClick={!isOpen ? onClick : undefined}
        className={cn(
          "fixed top-0 left-0 w-1/2 h-full z-40 cursor-pointer transition-transform",
          "bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513]",
          isOpen ? "-translate-x-full" : "translate-x-0",
          isRattling && !isOpen && "animate-curtain-rattle-left"
        )}
        style={{
          transitionDuration: "900ms",
          transitionTimingFunction: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        }}
      >
        {/* Noren pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 80px,
              rgba(0,0,0,0.1) 80px,
              rgba(0,0,0,0.1) 82px
            )`,
            }}
          />
        </div>
        {/* Fabric folds */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[2px] bg-black/10"
              style={{ left: `${(i + 1) * 16}%` }}
            />
          ))}
        </div>
        {/* Japanese text */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[#F8F4EE]/80 text-4xl font-serif writing-vertical">
          酒
        </div>
      </div>

      {/* Right Curtain */}
      <div
        onClick={!isOpen ? onClick : undefined}
        className={cn(
          "fixed top-0 right-0 w-1/2 h-full z-40 cursor-pointer transition-transform",
          "bg-gradient-to-l from-[#8B4513] via-[#A0522D] to-[#8B4513]",
          isOpen ? "translate-x-full" : "translate-x-0",
          isRattling && !isOpen && "animate-curtain-rattle-right"
        )}
        style={{
          transitionDuration: "900ms",
          transitionTimingFunction: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        }}
      >
        {/* Noren pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 80px,
              rgba(0,0,0,0.1) 80px,
              rgba(0,0,0,0.1) 82px
            )`,
            }}
          />
        </div>
        {/* Fabric folds */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[2px] bg-black/10"
              style={{ left: `${(i + 1) * 16}%` }}
            />
          ))}
        </div>
        {/* Japanese text */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[#F8F4EE]/80 text-4xl font-serif writing-vertical">
          菜
        </div>
      </div>

      {/* Click hint */}
      {!isOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div
            className={cn(
              "text-[#F8F4EE] text-lg font-light tracking-widest opacity-80 transition-opacity duration-300",
              isRattling && "opacity-100"
            )}
          >
            TAP TO ENTER
          </div>
        </div>
      )}
    </>
  );
}
