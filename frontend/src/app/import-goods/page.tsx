"use client";

import React, { useState, useEffect } from "react";
import { Import, Clock, TrendingUp, ShieldAlert, CheckCircle, Flame } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { useImport } from "@/shared/hooks/useImport";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { Product, ImportOrder } from "@/shared/types/api.types";
import { getProductVisual } from "@/shared/lib/productHelper";

// Fallback products data if catalog is loading
const STREET_PRODUCTS: Product[] = [
  { id: "p1", name: "Bánh mì", category: "food", importPrice: 50, sellPrice: 90, timeSeconds: 20, levelRequired: 1, iconName: "sandwich", color: "bg-amber-100 border-amber-300" },
  { id: "p2", name: "Trà đá", category: "drink", importPrice: 25, sellPrice: 45, timeSeconds: 15, levelRequired: 1, iconName: "cup-soda", color: "bg-teal-100 border-teal-300" },
  { id: "p3", name: "Hướng dương", category: "food", importPrice: 35, sellPrice: 60, timeSeconds: 25, levelRequired: 1, iconName: "flower", color: "bg-yellow-100 border-yellow-300" },
  { id: "p4", name: "Bánh cuốn", category: "food", importPrice: 85, sellPrice: 140, timeSeconds: 35, levelRequired: 2, iconName: "scroll", color: "bg-indigo-100 border-indigo-300" },
  { id: "p5", name: "Tàu hũ nóng", category: "drink", importPrice: 70, sellPrice: 120, timeSeconds: 30, levelRequired: 2, iconName: "soup", color: "bg-rose-100 border-rose-300" },
  { id: "p6", name: "Tò he", category: "toy", importPrice: 120, sellPrice: 210, timeSeconds: 45, levelRequired: 3, iconName: "toy-brick", color: "bg-emerald-100 border-emerald-300" },
  { id: "p7", name: "Nem chua rán", category: "food", importPrice: 180, sellPrice: 350, timeSeconds: 80, levelRequired: 4, iconName: "bento", color: "bg-rose-100 border-rose-300" },
  { id: "p8", name: "Yogurt nếp cẩm", category: "drink", importPrice: 130, sellPrice: 270, timeSeconds: 70, levelRequired: 5, iconName: "wine", color: "bg-indigo-100 border-indigo-300" },
  { id: "p9", name: "Xôi xéo thơm dẻo", category: "food", importPrice: 250, sellPrice: 520, timeSeconds: 150, levelRequired: 6, iconName: "bowl", color: "bg-amber-100 border-amber-300" },
  { id: "p10", name: "Sấu đá phố cổ", category: "drink", importPrice: 100, sellPrice: 220, timeSeconds: 60, levelRequired: 7, iconName: "glass", color: "bg-green-100 border-green-300" },
  { id: "p11", name: "Bắp nướng mỡ hành", category: "food", importPrice: 300, sellPrice: 650, timeSeconds: 180, levelRequired: 8, iconName: "lollipop", color: "bg-yellow-100 border-yellow-300" },
  { id: "p12", name: "Phở gánh Hà Nội", category: "food", importPrice: 500, sellPrice: 1100, timeSeconds: 240, levelRequired: 10, iconName: "ramen", color: "bg-red-100 border-red-300" },
];

export default function ImportGoodsPage() {
  const { products, importOrders, importProduct, claimOrder } = useImport();
  const { player } = usePlayer(true);

  // Player profile state values
  const playerLevel = player?.level ?? 1;
  const playerCoins = player?.coins ?? 0;

  // Selected Product Context
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tahien" | "hotay" | "congtruong">("tahien");
  
  // Local active orders state with 1s ticking intervals
  const [activeOrders, setActiveOrders] = useState<ImportOrder[]>([]);
  const ordersKey = (importOrders || []).map(o => `${o.id}_${o.timeRemaining}`).join(",");
  const [prevOrdersKey, setPrevOrdersKey] = useState<string | null>(null);

  if (ordersKey !== prevOrdersKey) {
    setActiveOrders(importOrders || []);
    setPrevOrdersKey(ordersKey);
  }

  // Real-time countdown clock ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.timeRemaining > 0) {
            return {
              ...order,
              timeRemaining: Math.max(order.timeRemaining - 1, 0),
            };
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Display catalog products with system values or fallback
  const catalogProducts = products.length > 0 ? products : STREET_PRODUCTS;

  const filteredProducts = catalogProducts.filter((product) => {
    if (activeTab === "tahien") {
      return product.levelRequired < 20;
    } else if (activeTab === "hotay") {
      return product.levelRequired >= 20 && product.levelRequired < 30;
    } else {
      return product.levelRequired >= 30;
    }
  });

  // Calculation helpers
  const totalCost = selectedProduct ? selectedProduct.importPrice * quantity : 0;
  const totalProfit = selectedProduct ? (selectedProduct.sellPrice - selectedProduct.importPrice) * quantity : 0;
  const canAfford = playerCoins >= totalCost;

  // Handle open selector sheet
  const handleOpenSheet = (product: Product) => {
    if (playerLevel < product.levelRequired) return; // Locked product
    setSelectedProduct(product);
    setQuantity(10);
    setIsSheetOpen(true);
  };

  // Import Action Trigger
  const handleImportSubmit = () => {
    if (!selectedProduct || !canAfford) return;

    importProduct(
      { productId: selectedProduct.id, quantity },
      {
        onSuccess: (res) => {
          if (res.success) {
            setIsSheetOpen(false);
            setSelectedProduct(null);
          }
        },
      }
    );
  };

  // Claim active order
  const handleClaimOrder = (orderId: string) => {
    claimOrder(orderId);
  };

  return (
    <GameShell>
      <div className="space-y-8 select-none">
        {/* 1. Page Header description */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h2 className="text-sm md:text-lg font-bold font-retro text-white flex items-center gap-3 tracking-tight glow-cta">
              <Import className="w-7 h-7 text-cta animate-float" /> NHẬP HÀNG VỀ KHO
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 font-body tracking-wider uppercase">
              Nhập nguyên liệu đặc sản đường phố, phân phối gánh hàng rong của bạn.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-primary/40 bg-primary/5 py-2px px-4 rounded-xl text-xs font-semibold text-primary flex items-center gap-2">
            <Flame className="w-4 h-4 text-cta" /> Đơn hàng về sẽ tự động xếp vào Kho đồ chính.
          </div>
        </div>

        {/* 2. ACTIVE IMPORTS VIEWPORT (CRITICAL ORDER BLOCK) */}
        {activeOrders.length > 0 && (
          <div className="bg-slate-950 text-slate-200 border-4 border-double border-slate-700 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <h3 className="font-retro text-xs text-[#EAB308] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#EAB308] animate-spin" style={{ animationDuration: "3s" }} /> 
              Xe Hàng Đang Về ({activeOrders.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => {
                const percentage = ((order.totalTime - order.timeRemaining) / order.totalTime) * 100;
                const isReady = order.timeRemaining === 0;

                return (
                  <div
                    key={order.id}
                    className={`bg-slate-900 border-4 border-double rounded-xl p-4 flex flex-col justify-between gap-3 transition-all ${
                      isReady ? "border-gem shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-100 font-retro tracking-tight">{order.name}</h4>
                        <p className="text-xs text-slate-400 font-pixel mt-1.5">Số lượng: {order.quantity} cái</p>
                      </div>
                      
                      {isReady ? (
                        <span className="bg-gem/10 border border-gem/30 text-gem py-1 px-3.5 rounded-lg text-xs font-retro flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Hàng đã về!
                        </span>
                      ) : (
                        <span className="text-[#EAB308] text-xs font-retro flex items-center gap-1">
                          {order.timeRemaining} giây
                        </span>
                      )}
                    </div>

                    {/* Progress tracking countdown */}
                    {isReady ? (
                      <Button
                        onClick={() => handleClaimOrder(order.id)}
                        variant="primary"
                        size="sm"
                        className="w-full font-retro text-xs tracking-wider py-2.5"
                      >
                        XẾP VÀO KHO
                      </Button>
                    ) : (
                      <div className="w-full h-3 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className="h-full bg-linear-to-r from-[#EAB308] to-cta rounded-sm transition-all duration-1000 ease-linear"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. PRODUCT CATALOG GRID */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
            <h3 className="text-sm font-bold font-retro text-slate-300 tracking-wider uppercase">Danh mục nguyên liệu hệ thống</h3>
            
            <div className="flex bg-slate-950/80 border border-slate-800/80 gap-1 p-1 rounded-xl w-full md:w-auto max-w-md">
              <button
                onClick={() => setActiveTab("tahien")}
                className={`flex-1 md:flex-none py-2 px-4 rounded-lg font-retro text-[10px] font-bold transition-all text-center cursor-pointer ${
                  activeTab === "tahien"
                    ? "bg-cta text-white shadow-md shadow-cta/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                Tạ Hiện
              </button>
              
              <button
                disabled={playerLevel < 20}
                onClick={() => setActiveTab("hotay")}
                className={`flex-1 md:flex-none py-2 px-4 rounded-lg font-retro text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  playerLevel < 20 ? "opacity-40 cursor-not-allowed text-slate-650" : ""
                } ${
                  activeTab === "hotay"
                    ? "bg-cta text-white shadow-md shadow-cta/20"
                    : playerLevel >= 20
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    : "text-slate-500"
                }`}
              >
                {playerLevel < 20 && <ShieldAlert className="w-3 h-3 text-slate-500" />}
                Hồ Tây {playerLevel < 20 && <span className="text-[8px] font-pixel bg-slate-900/60 px-1 py-0.5 rounded text-slate-450">Lv20</span>}
              </button>

              <button
                disabled={playerLevel < 30}
                onClick={() => setActiveTab("congtruong")}
                className={`flex-1 md:flex-none py-2 px-4 rounded-lg font-retro text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  playerLevel < 30 ? "opacity-40 cursor-not-allowed text-slate-650" : ""
                } ${
                  activeTab === "congtruong"
                    ? "bg-cta text-white shadow-md shadow-cta/20"
                    : playerLevel >= 30
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    : "text-slate-500"
                }`}
              >
                {playerLevel < 30 && <ShieldAlert className="w-3 h-3 text-slate-500" />}
                Cổng Trường {playerLevel < 30 && <span className="text-[8px] font-pixel bg-slate-900/60 px-1 py-0.5 rounded text-slate-450">Lv30</span>}
              </button>
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-950 border-4 border-dashed border-slate-800 rounded-xl p-10 text-center text-xs font-retro text-slate-400">
              Không có sản phẩm nào ở khu vực này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
              const isLocked = playerLevel < product.levelRequired;
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenSheet(product)}
                  className={`bg-slate-900 border-4 border-double rounded-xl p-5 relative flex flex-col justify-between gap-4 select-none ${
                    isLocked ? "opacity-80 cursor-not-allowed border-slate-800" : "hover:border-cta/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] border-slate-700 transition-all hover:scale-103"
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-950 border-4 border-double border-slate-800 rounded-lg flex items-center justify-center text-3.5xl shadow-inner transition-transform duration-200 group-hover:scale-110 relative">
                      {getProductVisual(product.iconName).emoji}
                      {isLocked && (
                        <div className="absolute -top-1.5 -right-1.5 bg-slate-850 border border-slate-700 rounded-lg p-0.5 shadow-md flex items-center justify-center">
                          <ShieldAlert className="w-3.5 h-3.5 text-[#EAB308]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-white font-pixel leading-tight">{product.name}</h4>
                      <span className="bg-slate-800 border border-slate-700 text-slate-400 font-retro text-xs py-0.5 px-2 rounded mt-1.5 inline-block uppercase">
                        {product.category === "food" ? "Đồ Ăn" : product.category === "drink" ? "Đồ Uống" : "Đồ Chơi"}
                      </span>
                    </div>
                  </div>

                  {/* Statistics layout grid */}
                  <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800 py-3 text-xs font-pixel text-slate-400">
                    <div>
                      <p className="text-slate-500">Giá nhập:</p>
                      <p className="font-bold text-coin font-retro text-xs mt-1 flex items-center gap-1">
                        {product.importPrice} Xu
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Thời gian:</p>
                      <p className="font-bold text-slate-300 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-500" /> {product.timeSeconds}s
                      </p>
                    </div>
                    <div className="col-span-2 mt-1.5 flex items-center justify-between text-xs font-retro bg-emerald-950/30 text-gem py-1.5 px-3 rounded-lg border border-gem/20">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Lãi ròng / chiếc:</span>
                      <span className="font-bold text-gem">+{product.sellPrice - product.importPrice} Xu</span>
                    </div>
                  </div>

                  {/* Import/Lock Button */}
                  {isLocked ? (
                    <div className="w-full text-xs font-retro py-2.5 bg-slate-950 border border-slate-850 text-slate-400 rounded-lg flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#EAB308] animate-pulse" /> Cấp {product.levelRequired} Mở khóa
                    </div>
                  ) : (
                    <Button
                      onClick={() => {}} // Controlled by outer Card onClick
                      disabled={isLocked}
                      variant="secondary"
                      className="w-full text-xs font-retro py-2.5"
                    >
                      NHẬP HÀNG
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* 4. QUANTITY SELECTOR BOTTOM SHEET */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title={`Nhập hàng: ${selectedProduct?.name}`}
        >
          {selectedProduct && (
            <div className="space-y-6 select-none font-body">
              {/* Product brief info */}
              <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="w-14 h-14 bg-slate-900 border-4 border-double border-slate-800 rounded-lg flex items-center justify-center text-3.5xl">
                  {getProductVisual(selectedProduct.iconName).emoji}
                </div>
                <div>
                  <h4 className="font-bold text-sm font-retro text-white">{selectedProduct.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Giá nhập gốc: {selectedProduct.importPrice} Xu / cái</p>
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 font-retro">CHỌN SỐ LƯỢNG NHẬP</label>
                <div className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-850 rounded-xl p-2.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 10, 10))}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer font-bold text-xl flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="text-sm md:text-base font-black text-white font-retro">{quantity} cái</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 10, 100))}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer font-bold text-xl flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
                
                {/* Shortcuts */}
                <div className="flex justify-between gap-2 mt-2">
                  {[10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuantity(num)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-retro border transition-all cursor-pointer ${
                        quantity === num
                          ? "bg-cta text-white border-cta"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-350 border-slate-750"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost & Profit breakdowns */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-xs font-semibold text-slate-450 font-pixel">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tổng tiền nhập:</span>
                  <span className={`font-bold font-retro text-[10px] flex items-center gap-1 ${canAfford ? "text-white" : "text-red-500 font-black animate-pulse"}`}>
                    {totalCost} Xu
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#10B981]">
                  <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Tổng lãi dự kiến:</span>
                  <span className="font-bold font-retro text-[10px]">+{totalProfit} Xu</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2.5 mt-2">
                  <span>Thời gian chờ hàng về:</span>
                  <span className="font-bold flex items-center gap-1 text-white">
                    <Clock className="w-4 h-4 text-slate-500" /> {selectedProduct.timeSeconds} giây
                  </span>
                </div>
              </div>

              {/* Insufficient balance alerts */}
              {!canAfford && (
                <div className="bg-red-950/30 border border-red-900/30 py-3 px-4 rounded-xl flex items-start gap-2.5 text-[10px] text-red-400 leading-normal font-retro">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 animate-bounce" />
                  <p>Bạn không đủ Xu để nhập lô hàng này. Hãy buôn bán sạp hàng hiện tại để kiếm thêm Xu.</p>
                </div>
              )}

              {/* Import trigger CTA */}
              <Button
                onClick={handleImportSubmit}
                disabled={!canAfford}
                variant="primary"
                fullWidth
                className="py-3.5 font-retro text-[10px] tracking-wider"
              >
                XÁC NHẬN NHẬP HÀNG
              </Button>
            </div>
          )}
        </BottomSheet>
      </div>
    </GameShell>
  );
}
