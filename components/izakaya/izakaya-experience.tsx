"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MenuItem } from "@/lib/menu-data";
import { getTodayMenu } from "@/lib/api/daily-menu";
import { Curtains } from "./curtains";
import { Cloche } from "./cloche";
import { MenuCard } from "./menu-card";
import { Loader2 } from "lucide-react";

type AppState =
  | "curtains-closed"
  | "curtains-open"
  | "cloche-open"
  | "menu-viewing";

export function IzakayaExperience() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>("curtains-closed");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [hasOpenedMenuBefore, setHasOpenedMenuBefore] = useState(false);

  // Load today's menu
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingMenu(true);
      try {
        const todayMenu = await getTodayMenu();
        if (todayMenu && todayMenu.menuItems.length > 0) {
          const items: MenuItem[] = todayMenu.menuItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image || "",
          }));
          setMenuItems(items);
        } else {
          setMenuItems([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMenuItems([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadData();
  }, []);

  const handleCurtainClick = useCallback(() => {
    if (appState === "curtains-closed") {
      setAppState("curtains-open");
    }
  }, [appState]);

  const handleClocheClick = useCallback(() => {
    if (appState === "curtains-open") {
      setAppState("cloche-open");
      setTimeout(() => setAppState("menu-viewing"), 800);
    }
  }, [appState]);

  const handleMenuContinue = useCallback(() => {
    router.push("/order");
  }, [router]);

  const curtainsOpen = appState !== "curtains-closed";
  const clocheVisible = curtainsOpen && appState !== "menu-viewing";
  const clocheOpen = appState === "cloche-open" || appState === "menu-viewing";
  const menuCardVisible = appState === "menu-viewing";
  const isFirstMenuOpen = !hasOpenedMenuBefore && appState === "menu-viewing";

  // Update hasOpenedMenuBefore when menu is shown
  useEffect(() => {
    if (appState === "menu-viewing" && !hasOpenedMenuBefore) {
      setHasOpenedMenuBefore(true);
    }
  }, [appState, hasOpenedMenuBefore]);

  // Loading state
  if (isLoadingMenu) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-[#2A2A2A]/50">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F4EE] via-[#F5EDE3] to-[#EDE5D8]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
      </div>

      {/* Curtains */}
      <Curtains isOpen={curtainsOpen} onClick={handleCurtainClick} />

      {/* Cloche - Center Stage */}
      {clocheVisible && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <Cloche
            isVisible={true}
            isOpen={clocheOpen}
            onClick={handleClocheClick}
          />
        </div>
      )}

      {/* Menu Card - Premium reveal */}
      <MenuCard
        isVisible={menuCardVisible}
        isDocked={false}
        items={menuItems}
        onContinue={handleMenuContinue}
        isFirstOpen={isFirstMenuOpen}
      />
    </div>
  );
}
