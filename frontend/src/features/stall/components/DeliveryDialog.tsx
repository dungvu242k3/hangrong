"use client";

import React, { useState, useEffect } from "react";
import { X, Truck, Clock, Coins, ShieldAlert, Check, Gem, ArrowUpCircle, Award, Lock as LockIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDelivery } from "@/shared/hooks/useDelivery";
import { useImport } from "@/shared/hooks/useImport";
import { useInventory } from "@/shared/hooks/useInventory";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { getProductVisual } from "@/shared/lib/productHelper";
import { Button } from "@/shared/components/Button";

interface DeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryDialog: React.FC<DeliveryDialogProps> = ({ isOpen, onClose }) => {
  const { player } = usePlayer(true);
  const playerLevel = player?.level ?? 1;
  const playerCoins = player?.coins ?? 0;
  const playerGems = player?.gems ?? 0;

  const { products } = useImport();
  const { inventoryItems } = useInventory();
  
  const {
    orders,
    shippers,
    deliver,
    claimReward,
    upgradeShipper,
    instantComplete,
    isDelivering,
    isClaiming,
    isUpgrading,
    isCompleting,
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<"orders" | "shippers">("orders");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedShipperId, setSelectedShipperId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Background timer tick for countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Helpers to get product data by ID
  const getProductById = (pId: string) => {
    return products.find((p) => p.id === pId);
  };

  // Helper for inventory count
  const getInventoryQty = (pId: string) => {
    const item = inventoryItems.find((inv) => inv.productId === pId);
    return item ? item.quantity : 0;
  };

  // Timer helper
  const getRemainingSeconds = (busyUntilStr: string | null) => {
    if (!busyUntilStr) return 0;
    const diff = Math.floor((new Date(busyUntilStr).getTime() - nowTick) / 1000);
    return Math.max(0, diff);
  };

  // Calculate order refresh countdown based on oldest pending order's creation time
  const getRefreshCountdown = () => {
    const pendingOrders = orders.filter((o) => o.status === "pending");
    if (pendingOrders.length === 0) return 60;
    
    // We can show a simple countdown based on local clock ticking within the minute
    const secs = 60 - (Math.floor(nowTick / 1000) % 60);
    return secs;
  };

  // Compute selected orders statistics
  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
  
  const totalSelectedItems = selectedOrders.reduce((sum, order) => {
    return sum + Object.values(order.items).reduce((s, qty) => s + qty, 0);
  }, 0);

  const selectedShipper = shippers.find((s) => s.id === selectedShipperId);

  // Stock availability check
  const checkStockAvailability = () => {
    const aggItems: Record<string, number> = {};
    for (const order of selectedOrders) {
      for (const [pId, qty] of Object.entries(order.items)) {
        aggItems[pId] = (aggItems[pId] || 0) + qty;
      }
    }

    for (const [pId, reqQty] of Object.entries(aggItems)) {
      if (getInventoryQty(pId) < reqQty) {
        return false;
      }
    }
    return true;
  };

  const isStockOk = checkStockAvailability();

  // Validate dispatch action
  const getDispatchError = () => {
    if (selectedOrderIds.length === 0) return "Vui lòng chọn ít nhất 1 đơn hàng.";
    if (!selectedShipperId) return "Vui lòng chọn 1 shipper.";
    if (!selectedShipper) return "Không tìm thấy shipper.";
    if (selectedShipper.status !== "idle") return "Shipper được chọn đang bận giao hàng.";
    if (selectedOrderIds.length > selectedShipper.slots) {
      return `Shipper Cấp ${selectedShipper.level} chỉ giao tối đa ${selectedShipper.slots} đơn cùng lúc.`;
    }
    if (totalSelectedItems > selectedShipper.capacity) {
      return `Tổng sản phẩm (${totalSelectedItems}) vượt quá sức chứa (${selectedShipper.capacity}) của shipper.`;
    }
    if (!isStockOk) return "Kho đồ của bạn không đủ sản phẩm cho các đơn hàng đã chọn.";
    return null;
  };

  const dispatchError = getDispatchError();

  // Handle Dispatch
  const handleDispatch = () => {
    if (dispatchError || !selectedShipperId) return;
    deliver(
      { shipperId: selectedShipperId, orderIds: selectedOrderIds },
      {
        onSuccess: (res) => {
          if (res.success) {
            setSelectedOrderIds([]);
            setSelectedShipperId(null);
            setActiveTab("shippers"); // Show progress on shippers tab
          }
        },
      }
    );
  };

  // Shipper claim
  const handleClaim = (shipperId: string) => {
    claimReward({ shipperId });
  };

  // Shipper upgrade
  const handleUpgrade = (shipperId: string, currentLevel: number) => {
    const costs = [0, 50000, 150000, 400000, 1000000];
    const cost = costs[currentLevel] || 0;
    if (playerCoins < cost) return;

    upgradeShipper({ shipperId });
  };

  // Shipper instant complete
  const handleInstantComplete = (shipperId: string, busyUntil: string | null) => {
    if (!busyUntil) return;
    const remainingSecs = getRemainingSeconds(busyUntil);
    const gemCost = Math.max(1, Math.ceil(remainingSecs / 60));
    if (playerGems < gemCost) return;

    instantComplete({ shipperId });
  };

  // Toggle order checkbox selection
  const handleToggleOrder = (orderId: string, status: string) => {
    if (status !== "pending") return;
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Dialog Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="bg-slate-900 border-4 border-double border-slate-700 rounded-3xl p-6 shadow-2xl w-full max-w-4xl relative z-10 font-body max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-cta animate-float" />
              <div>
                <h3 className="text-lg md:text-xl font-bold font-retro text-white tracking-tight">
                  ĐIỀU HÀNH GIAO HÀNG (LV 30+)
                </h3>
                {activeTab === "orders" && (
                  <p className="text-xs text-slate-400 font-pixel mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin" style={{ animationDuration: "5s" }} /> 
                    Tự động làm mới đơn hàng trong: <span className="text-[#EAB308] font-bold">{getRefreshCountdown()} giây</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab Headers */}
          <div className="flex bg-slate-950 border border-slate-800 gap-1 p-1 rounded-xl w-full max-w-sm mb-5 self-start">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-2 px-4 rounded-lg font-retro text-xs font-bold transition-all text-center cursor-pointer ${
                activeTab === "orders"
                  ? "bg-cta text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Đơn hàng ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("shippers")}
              className={`flex-1 py-2 px-4 rounded-lg font-retro text-xs font-bold transition-all text-center cursor-pointer ${
                activeTab === "shippers"
                  ? "bg-cta text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Đội Shipper ({shippers.filter((s) => s.level > 0).length})
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === "orders" ? (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="bg-slate-950 border-4 border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="font-retro text-xs">Bạn chưa đạt Level 30 để mở khóa dịch vụ giao hàng shipper.</p>
                  </div>
                ) : (
                  <>
                    {/* Responsive Grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {orders.map((order) => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        const isDelivering = order.status === "delivering";

                        return (
                          <div
                            key={order.id}
                            onClick={() => handleToggleOrder(order.id, order.status)}
                            className={`bg-slate-950/40 border-4 border-double rounded-2xl p-4 flex flex-col justify-between gap-4 relative select-none cursor-pointer transition-all ${
                              isDelivering
                                ? "opacity-60 cursor-not-allowed border-slate-800 bg-slate-950/20"
                                : isSelected
                                ? "border-cta shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-slate-900/60"
                                : "border-slate-850 hover:border-slate-700 bg-slate-950/40 hover:-translate-y-0.5"
                            }`}
                          >
                            {/* Selection Checkmark Indicator */}
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 bg-cta text-white rounded-lg p-0.5 shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div>
                              {/* Order Info Badges */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`text-[8px] font-retro py-0.5 px-2 rounded-full uppercase font-black ${
                                    order.difficulty === "easy"
                                      ? "bg-gem/10 text-gem border border-gem/20"
                                      : order.difficulty === "medium"
                                      ? "bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20"
                                      : "bg-red-500/10 text-red-500 border border-red-500/20"
                                  }`}
                                >
                                  {order.difficulty === "easy" ? "Dễ" : order.difficulty === "medium" ? "Vừa" : "Khó"}
                                </span>
                                
                                <span className="text-[8px] font-pixel text-slate-500">
                                  {order.deliveryTimeSeconds}s đi đường
                                </span>
                              </div>

                              {/* Items Required List */}
                              <div className="space-y-1.5 border-b border-slate-800/60 pb-3 mt-3">
                                <p className="text-[9px] font-retro text-slate-500 uppercase tracking-wider">Yêu cầu giao:</p>
                                {Object.entries(order.items).map(([pId, reqQty]) => {
                                  const p = getProductById(pId);
                                  const visual = p ? getProductVisual(p.iconName) : { emoji: "🥖" };
                                  const inStock = getInventoryQty(pId);
                                  const isEnough = inStock >= reqQty;

                                  return (
                                    <div key={pId} className="flex items-center justify-between text-xs font-pixel">
                                      <span className="text-slate-300 flex items-center gap-1.5">
                                        <span className="text-base leading-none">{visual.emoji}</span>
                                        {p ? p.name : "Vật phẩm"}
                                      </span>
                                      <span className={`font-semibold ${isEnough ? "text-slate-400" : "text-red-500 font-bold"}`}>
                                        {reqQty} cái <span className="text-[10px] text-slate-550">({inStock})</span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Rewards Box */}
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] font-pixel space-y-1">
                                <div className="flex items-center justify-between text-[#EAB308]">
                                  <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Thưởng Xu:</span>
                                  <span className="font-retro font-bold text-xs">+{order.rewardCoins}</span>
                                </div>
                                <div className="flex items-center justify-between text-primary">
                                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Thưởng XP:</span>
                                  <span className="font-retro font-bold text-xs">+{order.rewardXp}</span>
                                </div>
                              </div>

                            {/* Dispatched state */}
                            {isDelivering && (
                              <div className="w-full text-center py-2 bg-slate-900 border border-slate-850 rounded-lg text-[9px] font-retro text-[#EAB308] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin" /> Đang giao hàng...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Dispatch controller panel */}
                    {selectedOrderIds.length > 0 && (
                      <div className="bg-slate-950 border-4 border-double border-slate-800 rounded-2xl p-5 space-y-4 font-body leading-normal">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h4 className="font-retro text-xs text-white">ĐIỀU HÀNH CHUYẾN ĐI</h4>
                            <p className="text-slate-400 text-xs mt-1 font-pixel">
                              Đã chọn <span className="text-cta font-bold">{selectedOrderIds.length} đơn</span> với tổng số <span className="text-[#EAB308] font-bold">{totalSelectedItems} sản phẩm</span>.
                            </p>
                          </div>

                          {/* Shipper selector for dispatcher */}
                          <div className="flex gap-2">
                            {shippers
                              .filter((sh) => sh.level > 0)
                              .map((sh) => {
                                const isSelected = selectedShipperId === sh.id;
                                const isBusy = sh.status !== "idle";
                                return (
                                  <button
                                    key={sh.id}
                                    disabled={isBusy}
                                    onClick={() => setSelectedShipperId(isSelected ? null : sh.id)}
                                    className={`py-2 px-3.5 border-2 rounded-xl text-center font-retro text-[10px] font-bold flex flex-col justify-center gap-0.5 cursor-pointer active:scale-97 transition-all ${
                                      isBusy
                                        ? "opacity-50 cursor-not-allowed border-slate-900 text-slate-600 bg-slate-950/20"
                                        : isSelected
                                        ? "border-cta bg-cta text-white"
                                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                                    }`}
                                  >
                                    <span>Giao hàng {sh.shipperIndex}</span>
                                    <span className="text-[8px] font-pixel opacity-80">Slots: {sh.slots} | Cap: {sh.capacity}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* Dispatch Button / Errors display */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-900 pt-4 mt-2">
                          <div className="flex-1">
                            {dispatchError ? (
                              <p className="text-red-500 font-retro text-[10px] flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 shrink-0" /> {dispatchError}
                              </p>
                            ) : (
                              <p className="text-gem font-retro text-[10px] flex items-center gap-1.5">
                                <Check className="w-4 h-4" /> Tuyến đường sẵn sàng điều phối.
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleDispatch}
                            disabled={!!dispatchError || isDelivering}
                            variant="primary"
                            className="font-retro text-[10px] tracking-wider py-2.5 px-8 md:w-auto w-full"
                          >
                            XUẤT PHÁT GIAO HÀNG
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Tab Shippers view
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((idx) => {
                    const sh = shippers.find((s) => s.shipperIndex === idx);
                    const unlockLevel = idx === 1 ? 30 : idx === 2 ? 40 : 50;
                    const isLocked = playerLevel < unlockLevel || !sh;

                    if (isLocked) {
                      return (
                        <div
                          key={`locked-${idx}`}
                          className="bg-slate-950/20 border-4 border-dashed border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 opacity-60 min-h-[220px]"
                        >
                          <LockIcon className="w-8 h-8 text-slate-650" />
                          <div>
                            <h4 className="font-retro text-xs text-slate-500 font-bold uppercase">Shipper {idx}</h4>
                            <p className="text-[10px] text-slate-600 font-pixel mt-1">Yêu cầu cấp người chơi: {unlockLevel}</p>
                          </div>
                        </div>
                      );
                    }

                    const remaining = getRemainingSeconds(sh.busyUntil);
                    const isFinished = sh.status === "delivering" && remaining === 0;
                    const percentage = sh.busyUntil
                      ? 100 - (remaining / 120) * 100 // placeholder calculation base
                      : 0;

                    const upgradeCosts = [0, 50000, 150000, 400000, 1000000];
                    const nextCost = upgradeCosts[sh.level] || 0;

                    return (
                      <div
                        key={sh.id}
                        className={`bg-slate-950/40 border-4 border-double rounded-2xl p-5 flex flex-col justify-between gap-5 relative ${
                          sh.status === "delivering" ? "border-[#EAB308]/60" : "border-slate-800"
                        }`}
                      >
                        {/* Shipper Index Header */}
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <h4 className="font-retro text-xs font-bold text-white uppercase">Shipper {idx}</h4>
                          <span
                            className={`text-[9px] font-retro py-0.5 px-2.5 rounded-full font-bold uppercase ${
                              sh.status === "idle"
                                ? "bg-gem/10 text-gem border border-gem/20"
                                : isFinished
                                ? "bg-primary/10 text-primary border border-primary/20 animate-pulse"
                                : "bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20"
                            }`}
                          >
                            {sh.status === "idle" ? "Sẵn sàng" : isFinished ? "Đã xong" : "Đang giao"}
                          </span>
                        </div>

                        {/* Shipper Attributes */}
                        <div className="space-y-2 text-xs font-pixel text-slate-400">
                          <div className="flex justify-between">
                            <span>Cấp độ:</span>
                            <span className="text-white font-retro text-[10px] font-bold">Cấp {sh.level}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sức chứa:</span>
                            <span className="text-slate-200 font-bold">{sh.capacity} sản phẩm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Số ô đơn:</span>
                            <span className="text-slate-200 font-bold">{sh.slots} đơn hàng</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tốc độ:</span>
                            <span className="text-slate-200 font-bold">{sh.speedMultiplier.toFixed(2)}x</span>
                          </div>
                        </div>

                        {/* Status visual progress bars */}
                        {sh.status === "delivering" && (
                          <div className="space-y-2.5 bg-slate-900 p-3 rounded-xl border border-slate-850">
                            <div className="flex items-center justify-between text-[10px] font-pixel text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Giao hàng trong:</span>
                              <span className="text-white font-bold">{remaining} giây</span>
                            </div>
                            
                            {!isFinished && (
                              <div className="w-full h-2.5 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                                <div
                                  className="h-full bg-linear-to-r from-[#EAB308] to-cta rounded-sm transition-all duration-1000 ease-linear"
                                  style={{ width: `${Math.max(5, Math.min(percentage, 100))}%` }}
                                />
                              </div>
                            )}

                            {/* Gem Skip Button */}
                            {!isFinished && (
                              <button
                                onClick={() => handleInstantComplete(sh.id, sh.busyUntil)}
                                disabled={isCompleting || playerGems < Math.max(1, Math.ceil(remaining / 60))}
                                className="w-full py-2 px-3 border border-gem bg-gem/5 hover:bg-gem/10 text-gem rounded-xl font-retro text-[9px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Gem className="w-3.5 h-3.5 text-gem animate-float" /> Hoàn thành ngay ({Math.max(1, Math.ceil(remaining / 60))} Ngọc)
                              </button>
                            )}

                            {/* Claim Reward Button */}
                            {isFinished && (
                              <Button
                                onClick={() => handleClaim(sh.id)}
                                disabled={isClaiming}
                                variant="primary"
                                size="sm"
                                className="w-full font-retro text-[9px] py-2"
                              >
                                NHẬN THƯỞNG
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Upgrade Button */}
                        {sh.status === "idle" && sh.level < 5 && (
                          <button
                            onClick={() => handleUpgrade(sh.id, sh.level)}
                            disabled={isUpgrading || playerCoins < nextCost}
                            className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-[#EAB308]/40 hover:bg-slate-850 text-slate-200 rounded-xl font-retro text-[9px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5 text-[#EAB308]" /> Nâng cấp (+{nextCost.toLocaleString()} Xu)
                          </button>
                        )}
                        {sh.status === "idle" && sh.level === 5 && (
                          <div className="w-full py-2 bg-slate-950 border border-slate-900 text-slate-500 rounded-xl font-retro text-[9px] font-bold text-center uppercase tracking-wider select-none">
                            Shipper Max Cấp (5)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
