"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Store, ShieldAlert, Award, ArrowUpCircle, Flame, Info } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { gameEmitter } from "@/game/events/gameEmitter";
import { useStall } from "@/shared/hooks/useStall";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { useInventory } from "@/shared/hooks/useInventory";
import { InventoryItem } from "@/shared/types/api.types";
import { getProductVisual } from "@/shared/lib/productHelper";

// Dynamic import with ssr: false strictly avoids Node SSR crashes with WebGL canvas!
const StallSceneCanvas = dynamic(
  () => import("@/features/stall/components/StallSceneCanvas"),
  { ssr: false, loading: () => (
    <div className="w-full aspect-video md:aspect-16/10 bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-xs border-2 border-slate-200">
      Đang tải động cơ vẽ 2D...
    </div>
  )}
);

// Fallback inventory items if warehouse query is loading or empty
const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "i1", productId: "p1", name: "Bánh Mì Pate", category: "food", quantity: 15, sellPrice: 150, fastSellPrice: 100, iconName: "🥖", color: "bg-amber-100 border-amber-300", description: "" },
  { id: "i2", productId: "p2", name: "Trà Đá Vỉa Hè", category: "drink", quantity: 42, sellPrice: 50, fastSellPrice: 35, iconName: "🍵", color: "bg-teal-100 border-teal-300", description: "" },
  { id: "i3", productId: "p3", name: "Bánh Tráng Trộn", category: "food", quantity: 6, sellPrice: 300, fastSellPrice: 200, iconName: "🥗", color: "bg-orange-100 border-orange-300", description: "" },
];

const getProductDuration = (productId: string): number => {
  const durations: Record<string, number> = {
    p1: 60,
    p2: 30,
    p3: 120,
    p4: 90,
    p5: 180,
    p6: 150,
  };
  return durations[productId] || 60;
};

export default function StallPage() {
  const { slots, placeProduct, collectCoins, upgradeStall, isUpgrading } = useStall();
  const { player } = usePlayer(true);
  const { inventoryItems } = useInventory();

  // Player levels and currencies
  const level = player?.level ?? 1;
  const coins = player?.coins ?? 0;

  // Selector sheets
  const [isSlotSheetOpen, setIsSlotSheetOpen] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [slotStatusText, setSlotStatusText] = useState("");
  
  // Custom toast notification floating HUD
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show floating HUD notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync slots database values with PixiJS canvas on load or update
  useEffect(() => {
    if (slots && slots.length > 0) {
      gameEmitter.emit("react:sync_slots", { slots, stallLevel: level });
    }
  }, [slots, level]);

  // Hook gameEmitter listeners
  useEffect(() => {
    // 1. Listen for slot click from PixiJS Canvas
    const handleSlotClick = (data: {
      slotId: string;
      isEmpty: boolean;
      hasProduct: boolean;
      isReadyToCollect: boolean;
      productName?: string;
    }) => {
      setTargetSlotId(data.slotId);
      
      if (data.isEmpty) {
        setSlotStatusText("Ô bán hàng này đang trống. Hãy chọn món ăn trong kho để bày bán!");
        setIsSlotSheetOpen(true);
      } else if (data.isReadyToCollect) {
        // Find slot reward value to execute optimistic collection increment
        const clickedSlot = slots.find((s) => s.id === data.slotId);
        const reward = clickedSlot?.coinsReward ?? 100;
        collectCoins({ slotId: data.slotId, coinsReward: reward });
        showToast(`+${reward} Xu thu hoạch từ sạp hàng! 💰`);
      } else {
        showToast(`Món "${data.productName}" đang bán, vui lòng đợi đếm ngược hoàn tất!`);
      }
    };

    // 2. Listen for coin collection feedback directly on screen clicks
    const handleCoinCollect = (data: { slotId: string; amount: number }) => {
      collectCoins({ slotId: data.slotId, coinsReward: data.amount });
      showToast(`+${data.amount} Xu thu hoạch từ sạp hàng! 💰`);
    };

    gameEmitter.on("game:slot_clicked", handleSlotClick);
    gameEmitter.on("game:coin_collected", handleCoinCollect);

    return () => {
      gameEmitter.off("game:slot_clicked", handleSlotClick);
      gameEmitter.off("game:coin_collected", handleCoinCollect);
    };
  }, [slots, collectCoins]);



  // Place item on slot action
  const handlePlaceItem = (item: InventoryItem) => {
    if (!targetSlotId || item.quantity <= 0) return;

    // Trigger Place Product Mutation connected to the Backend API
    placeProduct(
      { slotId: targetSlotId, productId: item.productId },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            const duration = getProductDuration(item.productId);
            // Sync with PixiJS canvas app drawing state
            gameEmitter.emit("react:place_product", {
              slotId: targetSlotId,
              productId: item.productId,
              name: item.name,
              iconName: item.iconName,
              durationSeconds: duration,
            });

            setIsSlotSheetOpen(false);
            setTargetSlotId(null);
            showToast(`Đã bày "${item.name}" lên mặt sạp để bán! 🥖`);
          }
        },
      }
    );
  };

  // Upgrade Stall action
  const handleUpgradeStall = () => {
    const upgradeCost = level * 1000;
    if (coins < upgradeCost) {
      showToast("Bạn không đủ Xu để nâng cấp sạp hàng! ❌");
      return;
    }

    upgradeStall(undefined, {
      onSuccess: (res) => {
        if (res.success && res.data) {
          const nextLvl = res.data.newLevel;
          // Emit event to PixiJS to render glow upgrade
          gameEmitter.emit("react:upgrade_stall", { newLevel: nextLvl });
          showToast(`Chúc mừng! Sạp hàng đã nâng lên Cấp ${nextLvl}! 🎉`);
        }
      },
    });
  };

  const activeInventory = inventoryItems.length > 0 ? inventoryItems : FALLBACK_INVENTORY;

  return (
    <GameShell>
      <div className="space-y-6 relative select-none">
        
        {/* Floating Custom Toast Overlay Notification */}
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          {toastMessage && (
            <div className="bg-slate-900 border border-slate-700 text-[#EAB308] py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold font-retro animate-bounce">
              <Flame className="w-5 h-5 text-cta" /> {toastMessage}
            </div>
          )}
        </div>
 
        {/* 1. Header and Quick Upgrade Panel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
              <Store className="w-8 h-8 text-cta animate-float" /> Sạp Hàng Phố Cổ
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Phố Tạ Hiện nhộn nhịp. Hãy bày đồ ăn ra, thu hút khách hàng và thu tiền về gánh.
            </p>
          </div>

          <button
            onClick={handleUpgradeStall}
            disabled={isUpgrading}
            className="flex items-center justify-between gap-3 bg-linear-to-br from-[#EAB308] to-cta hover:from-[#F59E0B] hover:to-[#EA580C] text-white py-2.5 px-4.5 rounded-2xl cursor-pointer transition-all shadow-retro-md hover:scale-103 font-body font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpCircle className="w-5 h-5 animate-pulse" />
            <div className="text-left">
              <p className="leading-tight">{isUpgrading ? "Đang nâng..." : "Nâng cấp sạp"}</p>
              <p className="text-[10px] text-white/80 font-normal">Chi phí: {level * 1000} Xu</p>
            </div>
          </button>
        </div>

        {/* 2. CORE GAME CANVAS CONTAINER VIEWPORT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span className="flex items-center gap-1"><Info className="w-4 h-4 text-slate-400" /> Bấm trực tiếp vào các ô sạp tròn để bày hàng hoặc thu hoạch tiền xu.</span>
            <span className="hidden md:inline bg-slate-200 border border-slate-300 py-1 px-3 rounded-full text-[10px] font-bold">PC aspect aspect-[16/10]</span>
          </div>
          <StallSceneCanvas />
        </div>

        {/* 3. QUICK ONBOARDING GUIDE SCREEN */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm font-body leading-normal flex items-start gap-4">
          <div className="w-12 h-12 bg-cta/10 rounded-2xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-cta animate-float" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-800">Hướng dẫn nhanh cho chủ sạp mới:</h4>
            <p className="text-sm text-slate-500 mt-1 font-semibold">
              Nhập bánh mì hoặc trà đá tại mục **&quot;Nhập hàng&quot;**, sau đó quay lại màn hình này, click vào ô tròn trống trên sạp để bày hàng. Đợi khách hàng đến ăn hết và click trực tiếp vào ô để thu xu lấp lánh về ví!
            </p>
          </div>
        </div>

        {/* 4. SLOT INVENTORY SELECTOR BOTTOM SHEET */}
        <BottomSheet
          isOpen={isSlotSheetOpen}
          onClose={() => setIsSlotSheetOpen(false)}
          title="Bày bán nguyên liệu lên sạp"
        >
          <div className="space-y-5 font-body">
            <p className="text-sm font-semibold text-slate-500 leading-normal bg-slate-100 p-4 rounded-2xl flex items-start gap-2 border border-slate-200">
              <Info className="w-5 h-5 text-slate-400 mt-0.5" />
              <span>{slotStatusText}</span>
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 font-retro uppercase tracking-wider">Chọn món ăn có sẵn</label>
              
              {activeInventory.some((i) => i.quantity > 0) ? (
                <div className="space-y-2">
                  {activeInventory
                    .filter((item) => item.quantity > 0)
                    .map((item) => {
                      const duration = getProductDuration(item.productId);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handlePlaceItem(item)}
                          className="bg-white border-2 border-slate-200 hover:border-cta/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-99 hover:-translate-y-0.5 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 border rounded-xl flex items-center justify-center text-2.5xl ${getProductVisual(item.iconName).colorClass}`}>
                              {getProductVisual(item.iconName).emoji}
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-800">{item.name}</h4>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">Thời gian bán: {duration} giây</p>
                            </div>
                          </div>

                          <span className="bg-linear-to-br from-[#EAB308] to-cta text-white font-retro text-[9px] py-1.5 px-3 rounded-full shadow-md font-bold tracking-tight">
                            Còn {item.quantity} cái
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center p-6 border border-slate-200 border-dashed rounded-2xl">
                  <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-semibold mb-3">Kho đồ của bạn đang không có sẵn sản phẩm nào để bày bán.</p>
                  <Button
                    onClick={() => (window.location.href = "/import-goods")}
                    variant="primary"
                    size="sm"
                    className="font-retro text-[9px]"
                  >
                    ĐI NHẬP HÀNG NGAY
                  </Button>
                </div>
              )}
            </div>
          </div>
        </BottomSheet>
      </div>
    </GameShell>
  );
}

