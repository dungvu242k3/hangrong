"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Store, Heart, Trash2, ArrowLeft, ShieldAlert, BadgeHelp, Compass, Flame } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { Button } from "@/shared/components/Button";
import { useFriends } from "@/shared/hooks/useFriends";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { Friend, StallSlot } from "@/shared/types/api.types";
import { gameEmitter } from "@/game/events/gameEmitter";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic import strictly avoids Node SSR crashes with WebGL canvas
const StallSceneCanvas = dynamic(
  () => import("@/features/stall/components/StallSceneCanvas"),
  { ssr: false, loading: () => (
    <div className="w-full aspect-video md:aspect-16/10 bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-xs border-2 border-slate-200">
      Đang chuẩn bị gánh hàng hàng xóm...
    </div>
  )}
);

// Fallback friends list if database is empty
const MOCK_FRIENDS: Friend[] = [
  { id: "f1", username: "Tùng Bán Khoai", level: 4, coins: 18500, stallName: "Gánh Khoai Nướng Tạ Hiện", canHelp: true, canPrank: true },
  { id: "f2", username: "Hà Trà Chanh", level: 3, coins: 9200, stallName: "Sạp Trà Chanh Phố Cổ", canHelp: true, canPrank: false },
  { id: "f3", username: "Dũng Bánh Mì", level: 5, coins: 34000, stallName: "Bánh Mì Thơm Giòn Lò", canHelp: false, canPrank: true },
];

// Fallback neighbor slots if database query is empty
const MOCK_NEIGHBOR_SLOTS: StallSlot[] = [
  { id: "slot1", productId: "p1", productName: "Bánh Mì Pate", productIcon: "🥖", timeRemaining: 15, totalTime: 60, isReadyToCollect: false, coinsReward: 150 },
  { id: "slot2", productId: "p2", productName: "Trà Đá Vỉa Hè", productIcon: "🍵", timeRemaining: 0, totalTime: 30, isReadyToCollect: true, coinsReward: 80 },
  { id: "slot3", productId: null, productName: null, productIcon: null, timeRemaining: 0, totalTime: 0, isReadyToCollect: false, coinsReward: 0 },
];

export default function FriendsPage() {
  const { friends, useNeighborStall, helpNeighbor, isHelping, prankNeighbor, isPranking } = useFriends();
  usePlayer(true);

  // Active visit states
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Custom Loading skeleton trigger for neighbor stall loading
  const [isNeighborLoading, setIsNeighborLoading] = useState(false);

  // Confirm dialog state for Prank
  const [confirmPrankOpen, setConfirmPrankOpen] = useState(false);

  // Local state for Daily Limit constraints (fallback simulated)
  const [dailyLimits, setDailyLimits] = useState<Record<string, number>>({
    f1: 3,
    f2: 2,
    f3: 0, // Simulated limit reached for user demonstration
  });

  // Local state for interactive Cooldown Tickers (in seconds)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Tick cooldowns down every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        let updated = false;
        for (const key in next) {
          if (next[key] > 0) {
            next[key] -= 1;
            updated = true;
          }
        }
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger neighbor scene loading sequence end
  useEffect(() => {
    if (activeFriend) {
      const timer = setTimeout(() => {
        setIsNeighborLoading(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [activeFriend]);

  // Load neighbor slots state
  const { data: neighborSlots } = useNeighborStall(activeFriend?.id || null);

  const enableMockFallback = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK !== "false";
  const displayFriends = friends.length > 0 ? friends : (enableMockFallback ? MOCK_FRIENDS : []);
  const activeSlots = useMemo(() => {
    return neighborSlots && neighborSlots.length > 0 ? neighborSlots : (enableMockFallback ? MOCK_NEIGHBOR_SLOTS : []);
  }, [neighborSlots, enableMockFallback]);

  // Sync slots to neighbor canvas once loaded or changed
  useEffect(() => {
    if (activeFriend && activeSlots && !isNeighborLoading) {
      // Small timeout to let Pixi canvas initialize first
      const timer = setTimeout(() => {
        gameEmitter.emit("react:sync_slots", {
          slots: activeSlots,
          stallLevel: activeFriend.level,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeFriend, activeSlots, isNeighborLoading]);

  // Show custom toast HUD alert
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Help Neighbor Stall Action
  const handleHelpStall = () => {
    if (!activeFriend) return;
    
    // Check local limits first
    const remainingLimits = dailyLimits[activeFriend.id] ?? 3;
    if (remainingLimits <= 0) {
      showToast("Hôm nay đã hết lượt tương tác với sạp bạn này!");
      return;
    }

    if ((cooldowns[activeFriend.id] ?? 0) > 0) {
      showToast(`Sạp đang trong trạng thái hồi chiêu!`);
      return;
    }

    helpNeighbor(activeFriend.id, {
      onSuccess: (res) => {
        if (res.success && res.data) {
          // Play green glowing ripple in canvas
          gameEmitter.emit("react:help_stall");
          showToast(`Đã giúp đỡ sạp bạn! Nhận +${res.data.gainedXp} Kinh nghiệm 💚`);
          
          // Decrement daily limit & start cooldown
          setDailyLimits((prev) => ({ ...prev, [activeFriend.id]: Math.max(remainingLimits - 1, 0) }));
          setCooldowns((prev) => ({ ...prev, [activeFriend.id]: 30 })); // 30s cooldown arpeggio
          
          // Locally toggle action state fallback
          activeFriend.canHelp = false;
        }
      },
    });
  };

  // Prank Neighbor Stall Action
  const handlePrankStall = () => {
    if (!activeFriend) return;
    
    // Check local limits first
    const remainingLimits = dailyLimits[activeFriend.id] ?? 3;
    if (remainingLimits <= 0) {
      showToast("Hôm nay đã hết lượt tương tác với sạp bạn này!");
      return;
    }

    if ((cooldowns[activeFriend.id] ?? 0) > 0) {
      showToast(`Sạp đang trong trạng thái hồi chiêu!`);
      return;
    }

    prankNeighbor(activeFriend.id, {
      onSuccess: (res) => {
        if (res.success && res.data) {
          // Play gray dust soot circles in canvas
          gameEmitter.emit("react:prank_stall");
          showToast(`Đã chọc phá sạp bạn! Nhận +${res.data.gainedXp} Kinh nghiệm 💨`);
          
          // Decrement daily limit & start cooldown
          setDailyLimits((prev) => ({ ...prev, [activeFriend.id]: Math.max(remainingLimits - 1, 0) }));
          setCooldowns((prev) => ({ ...prev, [activeFriend.id]: 45 })); // 45s cooldown
          
          // Locally toggle action state fallback
          activeFriend.canPrank = false;
        }
      },
    });
  };

  return (
    <GameShell>
      <div className="space-y-6 relative select-none">
        
        {/* Floating Custom Toast Overlay Notification */}
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          {toastMessage && (
            <div className="bg-slate-900 border border-slate-700 text-[#EAB308] py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold font-retro animate-bounce">
              <Flame className="w-5 h-5 text-cta animate-pulse" /> {toastMessage}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!activeFriend ? (
            // A. FRIENDS LIST DIRECTORY GRID
            <motion.div
              key="list"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Page header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
                    <Users className="w-8 h-8 text-cta animate-float" /> Bạn Bè Hàng Xóm
                  </h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Ghé thăm các sạp hàng xóm, hỗ trợ buôn bán hoặc trêu chọc họ để nhận EXP.
                  </p>
                </div>
                
                <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/10 py-2 px-4 rounded-2xl text-xs font-semibold text-[#3B82F6] flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-cta animate-spin" style={{ animationDuration: "8s" }} /> Mỗi hành động tương tác cho bạn thêm điểm danh tiếng.
                </div>
              </div>

              {/* Friends cards list with Empty State support */}
              {displayFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="card-retro border-slate-200 hover:border-cta/40 flex flex-col justify-between gap-5 group"
                    >
                      {/* Brief Profile info */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-linear-to-br from-[#EAB308] to-cta border-2 border-white rounded-2xl flex items-center justify-center text-white font-black text-xl font-retro shadow-md shadow-cta/15 group-hover:scale-103 transition-transform">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 leading-snug">{friend.username}</h4>
                          <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 font-bold py-0.5 px-2 rounded-full text-[9px] uppercase mt-1 inline-block">
                            Cấp {friend.level} chủ sạp
                          </span>
                        </div>
                      </div>

                      {/* Sạp Description info */}
                      <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-3 text-xs font-semibold text-slate-500 leading-normal">
                        <p className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-cta" /> {friend.stallName}
                        </p>
                        <p className="mt-1">Tài sản sạp: {friend.coins} Xu vàng</p>
                        <p className="text-slate-400 mt-1 font-bold">
                          Lượt còn lại hôm nay: {dailyLimits[friend.id] ?? 3} lượt
                        </p>
                      </div>

                      {/* Visit Button CTA */}
                      <Button
                        onClick={() => {
                          setActiveFriend(friend);
                          setIsNeighborLoading(true);
                        }}
                        variant="primary"
                        fullWidth
                        className="text-xs font-retro py-3"
                      >
                        GHÉ THĂM SẠP
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center max-w-lg mx-auto font-body select-none">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-xl font-bold text-slate-700 mb-1.5 font-heading">Không tìm thấy sạp hàng nào!</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 font-semibold">
                    Hiện sạp hàng của hàng xóm trống rỗng hoặc chế độ mock fallback đã tắt. Kết bạn thêm để bắt đầu tương tác nhé!
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="primary"
                    className="px-6 py-2.5 text-xs font-retro tracking-wider"
                  >
                    Tải lại danh sách
                  </Button>
                </div>
              )}
            </motion.div>
          ) : isNeighborLoading ? (
            // B. LOADING SKELETON
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 animate-pulse"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-28 bg-slate-200 rounded-xl" />
                  <div className="h-10 w-28 bg-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-64 bg-slate-100 rounded-md animate-pulse" />
                <div className="w-full aspect-video md:aspect-16/10 bg-slate-100 border-2 border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full animate-bounce" />
                  <div className="h-4 w-48 bg-slate-200 rounded-lg" />
                </div>
              </div>
            </motion.div>
          ) : (
            // C. NEIGHBOR IMMERSIVE CANVAS INTERACTIVE VIEW
            <motion.div
              key="visit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              {/* Back to friends list header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveFriend(null)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer transition-colors"
                    aria-label="Trở lại danh sách bạn bè"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold font-heading text-slate-800 flex items-center gap-2 leading-none">
                      Sạp hàng của {activeFriend.username}
                    </h2>
                    <p className="text-sm text-slate-500 font-semibold mt-1">
                      {activeFriend.stallName} (Cấp {activeFriend.level})
                    </p>
                  </div>
                </div>

                <div className="hidden md:inline bg-slate-200 border border-slate-300 py-1 px-3 rounded-full text-[10px] font-bold">
                  Đang ghé thăm
                </div>
              </div>

              {/* Neighbors main game scene canvas frame */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                  <span className="flex items-center gap-1">
                    <BadgeHelp className="w-4 h-4 text-[#3B82F6]" /> Bạn đang ghé thăm sạp hàng xóm. Các hành động chính nằm ở thanh tương tác bên dưới.
                  </span>
                  <span className="hidden md:inline bg-slate-200 border border-slate-300 py-0.5 px-2.5 rounded-full text-[10px] font-bold text-slate-600">
                    Active Scene
                  </span>
                </div>
                <StallSceneCanvas />
              </div>

              {/* 1. BOTTOM ACTION BAR (Help & Prank Spaced >= 48px target height) */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 select-none mt-4 font-body">
                {/* Left side: remaining limits & active cooldown display */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="bg-slate-100 border border-slate-200 py-2 px-4 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cta animate-spin" style={{ animationDuration: "12s" }} />
                    <span>
                      Lượt tương tác hôm nay:{" "}
                      <strong className="text-cta font-retro text-[10px]">
                        {dailyLimits[activeFriend.id] ?? 3} / 3
                      </strong>
                    </span>
                  </div>

                  {/* Cooldown Timer ticking indicator */}
                  {cooldowns[activeFriend.id] && cooldowns[activeFriend.id] > 0 ? (
                    <div className="bg-[#EAB308]/10 border border-[#EAB308]/20 py-2 px-4 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 animate-pulse">
                      <span>⏳ Hồi chiêu:</span>
                      <strong className="text-[#D97706] font-retro text-[10px]">
                        {cooldowns[activeFriend.id]}s
                      </strong>
                    </div>
                  ) : (
                    <div className="bg-gem/10 border border-gem/20 py-2 px-4 rounded-2xl text-xs font-bold text-gem flex items-center gap-1">
                      <span>✨ Sẵn sàng</span>
                    </div>
                  )}
                </div>

                {/* Right side: Button actions with strict size, spacing, and tooltips */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* HELP ACTION */}
                  <button
                    onClick={handleHelpStall}
                    disabled={
                      (dailyLimits[activeFriend.id] ?? 3) <= 0 ||
                      (cooldowns[activeFriend.id] ?? 0) > 0 ||
                      isHelping
                    }
                    style={{ minHeight: "48px" }}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 rounded-2xl cursor-pointer font-bold text-sm transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:scale-103 active:scale-97 select-none font-body"
                    title={(dailyLimits[activeFriend.id] ?? 3) <= 0 ? "Hết lượt tương tác trong ngày" : (cooldowns[activeFriend.id] ?? 0) > 0 ? "Đang hồi chiêu" : "Giúp đỡ sạp bạn bè"}
                  >
                    <Heart className="w-4.5 h-4.5 fill-white animate-pulse" />
                    <span>
                      {isHelping
                        ? "Đang giúp..."
                        : (dailyLimits[activeFriend.id] ?? 3) <= 0
                        ? "Hết lượt"
                        : (cooldowns[activeFriend.id] ?? 0) > 0
                        ? "Hồi chiêu"
                        : "Giúp đỡ sạp"}
                    </span>
                  </button>

                  {/* Wide separator to prevent clicking accidents */}
                  <div className="hidden md:block w-[1.5px] h-8 bg-slate-200" />

                  {/* PRANK ACTION (Triggers custom Confirm dialog modal) */}
                  <button
                    onClick={() => setConfirmPrankOpen(true)}
                    disabled={
                      (dailyLimits[activeFriend.id] ?? 3) <= 0 ||
                      (cooldowns[activeFriend.id] ?? 0) > 0 ||
                      isPranking
                    }
                    style={{ minHeight: "48px" }}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 rounded-2xl cursor-pointer font-bold text-sm transition-all shadow-[0_4px_12px_rgba(71,85,105,0.15)] hover:scale-103 active:scale-97 select-none font-body"
                    title={(dailyLimits[activeFriend.id] ?? 3) <= 0 ? "Hết lượt tương tác trong ngày" : (cooldowns[activeFriend.id] ?? 0) > 0 ? "Đang hồi chiêu" : "Trêu chọc phá sạp hàng xóm"}
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                    <span>
                      {isPranking
                        ? "Đang phá..."
                        : (dailyLimits[activeFriend.id] ?? 3) <= 0
                        ? "Hết lượt"
                        : (cooldowns[activeFriend.id] ?? 0) > 0
                        ? "Hồi chiêu"
                        : "Chọc phá"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Guidelines notes */}
              <div className="bg-red-50 border border-red-100 p-5 rounded-3xl text-xs text-slate-500 leading-normal flex items-start gap-3 mt-4">
                <ShieldAlert className="w-5 h-5 text-cta shrink-0" />
                <p className="font-semibold">
                  Mỗi ngày bạn chỉ được thực hiện tối đa 3 hành động tương tác xã hội (Giúp đỡ hoặc Chọc phá) trên mỗi sạp hàng của bạn bè. Giữa mỗi lần hành động cần thời gian hồi chiêu để khôi phục năng lượng. Hãy sử dụng lượt tương tác thật thông minh nhé!
                </p>
              </div>

              {/* D. CUSTOM PRANK CONFIRMATION DIALOG MODAL */}
              <AnimatePresence>
                {confirmPrankOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full select-none text-slate-800 font-body"
                    >
                      <h4 className="text-xl font-bold font-heading text-slate-800 mb-2 flex items-center gap-2">
                        ⚠️ Xác nhận chọc phá?
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed font-semibold mb-6">
                        Bạn muốn chọc phá sạp hàng của <strong className="text-slate-800">{activeFriend.username}</strong>?
                        Hành động này sẽ tạm dừng việc bán hàng của họ và phủ khói bụi đen lên sạp.
                        <br />
                        <span className="text-cta mt-2.5 block font-bold">
                          Hôm nay bạn còn <strong className="font-retro text-[9px] bg-cta/10 py-0.5 px-2 rounded-full text-cta">{dailyLimits[activeFriend.id] ?? 3} lượt</strong> tương tác với sạp này.
                        </span>
                      </p>

                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setConfirmPrankOpen(false)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl cursor-pointer text-xs font-bold transition-all"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={() => {
                            setConfirmPrankOpen(false);
                            handlePrankStall();
                          }}
                          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl cursor-pointer text-xs font-bold transition-all shadow-md shadow-slate-700/10"
                        >
                          Xác nhận
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
