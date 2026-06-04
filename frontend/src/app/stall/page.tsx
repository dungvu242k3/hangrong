"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Store, ShieldAlert, Award, ArrowUpCircle, Flame, Info, Truck } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { gameEmitter } from "@/game/events/gameEmitter";
import { useStall } from "@/shared/hooks/useStall";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { useInventory } from "@/shared/hooks/useInventory";
import { useDelivery } from "@/shared/hooks/useDelivery";
import { DeliveryDialog } from "@/features/stall/components/DeliveryDialog";
import { InventoryItem } from "@/shared/types/api.types";
import { getProductVisual } from "@/shared/lib/productHelper";

// Dynamic import with ssr: false strictly avoids Node SSR crashes with WebGL canvas!
const StallSceneCanvas = dynamic(
  () => import("@/features/stall/components/StallSceneCanvas"),
  { ssr: false, loading: () => (
    <div className="w-full aspect-4/3 md:aspect-16/7 bg-slate-900 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-xs border-4 border-double border-slate-800">
      Đang tải động cơ vẽ 2D...
    </div>
  )}
);

// Fallback inventory items if warehouse query is loading or empty
const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "i1", productId: "p1", name: "Bánh mì", category: "food", quantity: 15, sellPrice: 90, fastSellPrice: 50, iconName: "sandwich", color: "bg-amber-100 border-amber-300", description: "" },
  { id: "i2", productId: "p2", name: "Trà đá", category: "drink", quantity: 42, sellPrice: 45, fastSellPrice: 25, iconName: "cup-soda", color: "bg-teal-100 border-teal-300", description: "" },
  { id: "i3", productId: "p3", name: "Hướng dương", category: "food", quantity: 6, sellPrice: 60, fastSellPrice: 35, iconName: "flower", color: "bg-yellow-100 border-yellow-300", description: "" },
];

const getProductDuration = (productId: string): number => {
  const durations: Record<string, number> = {
    p1: 20, // Bánh mì
    p2: 15, // Trà đá
    p3: 25, // Hướng dương
    p4: 35, // Bánh cuốn
    p5: 30, // Tàu hũ nóng
    p6: 45, // Tò he
    p7: 80, // Nem chua rán
    p8: 70, // Yogurt nếp cẩm
    p9: 150, // Xôi xéo
    p10: 60, // Sấu đá
    p11: 180, // Bắp nướng
    p12: 240, // Phở gánh
  };
  return durations[productId] || 60;
};

export default function StallPage() {
  const { slots, placeProduct, collectCoins, upgradeStall, isUpgrading } = useStall();
  const { player } = usePlayer(true);
  const { inventoryItems } = useInventory();
  const { shippers } = useDelivery();

  // Player levels and currencies
  const level = player?.stallLevel ?? 1;
  const coins = player?.coins ?? 0;
  const playerLevel = player?.level ?? 1;

  // Selector sheets
  const [isSlotSheetOpen, setIsSlotSheetOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [slotStatusText, setSlotStatusText] = useState("");
  
  // Custom toast notification floating HUD
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep track of current time dynamically to avoid impure render calls
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show floating HUD notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync slots database values with PixiJS canvas on load or update
  useEffect(() => {
    // 1. Sync immediately if canvas is already loaded
    if (slots && slots.length > 0) {
      gameEmitter.emit("react:sync_slots", { slots, stallLevel: level });
    }

    // 2. Sync when game canvas signals it's ready (resolves race condition on first load/restart)
    const handleGameReady = () => {
      if (slots && slots.length > 0) {
        gameEmitter.emit("react:sync_slots", { slots, stallLevel: level });
      }
    };

    gameEmitter.on("game:ready", handleGameReady);

    return () => {
      gameEmitter.off("game:ready", handleGameReady);
    };
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
            // Read duration dynamically from backend response, supporting infinite products
            const duration = res.data.slot.totalTime || getProductDuration(item.productId);
            // Sync with PixiJS canvas app drawing state
            gameEmitter.emit("react:place_product", {
              slotId: targetSlotId,
              productId: item.productId,
              name: item.name,
              iconName: item.iconName,
              durationSeconds: duration,
              coinsReward: item.sellPrice,
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
    if (level >= 6) {
      showToast("Sạp hàng đã đạt cấp độ tối đa! 🏆");
      return;
    }
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
    <GameShell fullWidth>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading text-slate-100 flex items-center gap-2">
              <Store className="w-8 h-8 text-cta animate-float" /> Sạp Hàng Phố Cổ
            </h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">
              Phố Tạ Hiện nhộn nhịp. Hãy bày đồ ăn ra, thu hút khách hàng và thu tiền về gánh.
            </p>
          </div>

          {level >= 6 ? (
            <div className="flex items-center justify-center gap-3 bg-slate-800 text-slate-400 py-2.5 px-6 rounded-2xl border border-slate-700 font-body font-bold text-sm">
              <Award className="w-5 h-5 shrink-0 text-slate-500" />
              <div className="text-left">
                <p className="leading-tight">Cấp Tối Đa</p>
                <p className="text-[10px] text-slate-500 font-normal">Sạp đã đạt cấp tối đa</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleUpgradeStall}
              disabled={isUpgrading}
              className="flex items-center justify-center gap-3 bg-linear-to-br from-[#EAB308] to-cta hover:from-[#F59E0B] hover:to-[#EA580C] text-white py-2.5 px-6 rounded-2xl cursor-pointer transition-all shadow-retro-md hover:scale-103 font-body font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-cta/20"
            >
              <ArrowUpCircle className="w-5 h-5 animate-pulse shrink-0" />
              <div className="text-left">
                <p className="leading-tight">{isUpgrading ? "Đang nâng..." : "Nâng cấp sạp"}</p>
                <p className="text-[10px] text-white/80 font-normal">Chi phí: {level * 1000} Xu</p>
              </div>
            </button>
          )}
        </div>

        {/* 2. CORE GAME CANVAS CONTAINER VIEWPORT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 select-none">
            <span className="flex items-center gap-1"><Info className="w-4 h-4 text-slate-500" /> Bấm trực tiếp vào các ô sạp tròn để bày hàng hoặc thu hoạch tiền xu.</span>
          </div>
          <div className="border-4 border-slate-800 bg-slate-950 rounded-2xl relative overflow-hidden shadow-2xl">
            <StallSceneCanvas />
          </div>
        </div>

        {/* 3. QUICK ONBOARDING GUIDE SCREEN */}
        <div className="glass-overlay retro-border rounded-3xl p-5 shadow-sm font-body leading-normal flex items-start gap-4">
          <div className="w-12 h-12 bg-cta/10 rounded-2xl flex items-center justify-center shrink-0 border border-cta/20">
            <Award className="w-6 h-6 text-cta animate-float" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-100">Hướng dẫn nhanh cho chủ sạp mới:</h4>
            <p className="text-sm text-slate-400 mt-1 font-semibold leading-relaxed">
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
            <p className="text-sm font-semibold text-slate-300 leading-normal bg-slate-950 p-4 rounded-2xl flex items-start gap-2 border border-slate-850">
              <Info className="w-5 h-5 text-slate-500 mt-0.5" />
              <span>{slotStatusText}</span>
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 font-retro uppercase tracking-wider">Chọn món ăn có sẵn</label>
              
              {activeInventory.some((i) => i.quantity > 0) ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {activeInventory
                    .filter((item) => item.quantity > 0)
                    .map((item) => {
                      const duration = getProductDuration(item.productId);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handlePlaceItem(item)}
                          className="bg-slate-900 border-4 border-double border-slate-700 hover:border-cta/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-99 hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 border rounded-xl flex items-center justify-center text-2.5xl ${getProductVisual(item.iconName).colorClass}`}>
                              {getProductVisual(item.iconName).emoji}
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-white">{item.name}</h4>
                              <p className="text-xs text-slate-350 font-semibold mt-0.5">Thời gian bán: {duration} giây</p>
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
                <div className="text-center p-6 border border-slate-800 border-dashed rounded-2xl">
                  <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-450 text-sm font-semibold mb-3">Kho đồ của bạn đang không có sẵn sản phẩm nào để bày bán.</p>
                  <Button
                    onClick={() => (window.location.href = "/import-goods")}
                    variant="primary"
                    size="sm"
                    className="font-retro text-xs"
                  >
                    ĐI NHẬP HÀNG NGAY
                  </Button>
                </div>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* Floating Delivery Orders HUD Trigger */}
        {playerLevel >= 30 && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setIsDeliveryDialogOpen(true)}
              className="w-14 h-14 bg-linear-to-br from-[#EAB308] to-cta hover:from-[#F59E0B] hover:to-[#EA580C] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-95 transition-all hover:scale-105 cursor-pointer relative"
              title="Điều hành giao hàng"
            >
              <Truck className="w-7 h-7" />
              
              {/* Notification Badge */}
              {shippers.some((sh) => sh.status === "delivering" && sh.busyUntil && new Date(sh.busyUntil).getTime() < nowTick) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[9px] font-retro font-bold text-white shadow-md animate-pulse">
                  !
                </span>
              )}
            </button>
          </div>
        )}

        {/* Delivery Management Dialog Overlay */}
        <DeliveryDialog
          isOpen={isDeliveryDialogOpen}
          onClose={() => setIsDeliveryDialogOpen(false)}
        />
      </div>
    </GameShell>
  );
}

