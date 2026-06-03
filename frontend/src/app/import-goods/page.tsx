"use client";

import React, { useState, useEffect } from "react";
import { Import, Clock, TrendingUp, ShieldAlert, CheckCircle, Flame } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { useImport } from "@/shared/hooks/useImport";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { Product, ImportOrder } from "@/shared/types/api.types";

// Fallback products data if catalog is loading
const STREET_PRODUCTS: Product[] = [
  { id: "p1", name: "Bánh Mì Pate", category: "food", importPrice: 80, sellPrice: 150, timeSeconds: 60, levelRequired: 1, iconName: "🥖", color: "bg-amber-100 border-amber-300" },
  { id: "p2", name: "Trà Đá Vỉa Hè", category: "drink", importPrice: 20, sellPrice: 50, timeSeconds: 30, levelRequired: 1, iconName: "🍵", color: "bg-teal-100 border-teal-300" },
  { id: "p3", name: "Bánh Tráng Trộn", category: "food", importPrice: 150, sellPrice: 300, timeSeconds: 120, levelRequired: 2, iconName: "🥗", color: "bg-orange-100 border-orange-300" },
  { id: "p4", name: "Nước Mía Siêu Sạch", category: "drink", importPrice: 60, sellPrice: 130, timeSeconds: 90, levelRequired: 2, iconName: "🍹", color: "bg-emerald-100 border-emerald-300" },
  { id: "p5", name: "Bắp Nướng Mỡ Hành", category: "food", importPrice: 200, sellPrice: 420, timeSeconds: 180, levelRequired: 3, iconName: "🌽", color: "bg-yellow-100 border-yellow-300" },
  { id: "p6", name: "Cà Phê Sữa Đá", category: "drink", importPrice: 100, sellPrice: 220, timeSeconds: 150, levelRequired: 3, iconName: "☕", color: "bg-yellow-900/10 border-yellow-600/30" },
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
              <Import className="w-8 h-8 text-cta" /> Nhập Hàng Về Kho
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Nhập nguyên liệu đặc sản đường phố, phân phối gánh hàng rong của bạn.
            </p>
          </div>
          
          <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/10 py-2 px-4 rounded-2xl text-xs font-semibold text-[#3B82F6] flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-cta" /> Đơn hàng về sẽ tự động xếp vào Kho đồ chính.
          </div>
        </div>

        {/* 2. ACTIVE IMPORTS VIEWPORT (CRITICAL ORDER BLOCK) */}
        {activeOrders.length > 0 && (
          <div className="bg-slate-900 text-slate-200 border-2 border-slate-700 rounded-3xl p-6 shadow-md relative overflow-hidden crt-overlay">
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
                    className={`bg-slate-800 border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                      isReady ? "border-gem shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-100">{order.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Số lượng: {order.quantity} cái</p>
                      </div>
                      
                      {isReady ? (
                        <span className="bg-gem/10 border border-gem/25 text-gem py-1 px-3.5 rounded-full text-xs font-bold flex items-center gap-1">
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
                        className="w-full font-retro text-[10px] tracking-wider py-2.5"
                      >
                        XẾP VÀO KHO
                      </Button>
                    ) : (
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                        <div
                          className="h-full bg-linear-to-r from-[#EAB308] to-cta rounded-full transition-all duration-1000 ease-linear"
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
        <div>
          <h3 className="text-2xl font-bold font-heading text-slate-700 mb-4">Danh mục nguyên liệu hệ thống</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogProducts.map((product) => {
              const isLocked = playerLevel < product.levelRequired;
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenSheet(product)}
                  className={`card-retro relative flex flex-col justify-between gap-4 select-none ${
                    isLocked ? "opacity-60 cursor-not-allowed border-slate-300" : "hover:border-cta/40 border-slate-200"
                  }`}
                >
                  {/* Lock HUD for restricted items */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10 text-slate-700">
                      <ShieldAlert className="w-8 h-8 text-slate-500 mb-1" />
                      <span className="font-bold text-xs uppercase tracking-wider bg-slate-200 py-1.5 px-3.5 rounded-full border border-slate-300">
                        Cấp {product.levelRequired} Mở khóa
                      </span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3.5xl shadow-sm ${product.color}`}>
                      {product.iconName}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 leading-tight">{product.name}</h4>
                      <span className="bg-slate-100 text-slate-500 font-bold border border-slate-200 py-0.5 px-2 rounded-full text-[10px] uppercase mt-1 inline-block">
                        {product.category === "food" ? "Đồ Ăn" : "Đồ Uống"}
                      </span>
                    </div>
                  </div>

                  {/* Statistics layout grid */}
                  <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3 text-sm font-body">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold">Giá nhập</p>
                      <p className="font-bold text-slate-700 mt-0.5 flex items-center gap-1 text-base">
                        {product.importPrice} <span className="text-[#F97316] text-xs font-bold">Xu</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold">Thời gian</p>
                      <p className="font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" /> {product.timeSeconds}s
                      </p>
                    </div>
                    <div className="col-span-2 mt-1.5 flex items-center justify-between text-xs font-semibold bg-emerald-50 text-emerald-700 py-1.5 px-3 rounded-xl border border-emerald-100">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Lãi ròng / chiếc:</span>
                      <span className="font-bold">+{product.sellPrice - product.importPrice} Xu</span>
                    </div>
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={() => {}} // Controlled by outer Card onClick
                    disabled={isLocked}
                    variant={isLocked ? "ghost" : "secondary"}
                    className="w-full text-xs font-retro py-2.5"
                  >
                    NHẬP HÀNG
                  </Button>
                </div>
              );
            })}
          </div>
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
              <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 p-4 rounded-2xl">
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-3.5xl">
                  {selectedProduct.iconName}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{selectedProduct.name}</h4>
                  <p className="text-xs font-semibold text-slate-500">Giá nhập gốc: {selectedProduct.importPrice} Xu / cái</p>
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-600">Chọn số lượng nhập</label>
                <div className="flex items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl p-2.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 10, 10))}
                    className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer font-bold text-xl flex items-center justify-center text-slate-600 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-slate-800 font-retro">{quantity} cái</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 10, 100))}
                    className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer font-bold text-xl flex items-center justify-center text-slate-600 active:scale-95 transition-all"
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
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        quantity === num
                          ? "bg-cta text-white border-cta"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost & Profit breakdowns */}
              <div className="bg-[#F8FAFC] border-2 border-slate-200 rounded-3xl p-4 space-y-2.5 text-sm font-semibold">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng tiền nhập:</span>
                  <span className={`font-bold flex items-center gap-1 ${canAfford ? "text-slate-800" : "text-red-500 font-black animate-pulse"}`}>
                    {totalCost} Xu
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Tổng lãi dự kiến:</span>
                  <span className="font-bold">+{totalProfit} Xu</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 border-t border-slate-200 pt-2.5 mt-2">
                  <span>Thời gian chờ hàng về:</span>
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" /> {selectedProduct.timeSeconds} giây
                  </span>
                </div>
              </div>

              {/* Insufficient balance alerts */}
              {!canAfford && (
                <div className="bg-red-50 border border-red-100 py-3 px-4 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 leading-normal">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="font-semibold">Bạn không đủ Xu để nhập lô hàng này. Hãy buôn bán sạp hàng hiện tại để kiếm thêm Xu.</p>
                </div>
              )}

              {/* Import trigger CTA */}
              <Button
                onClick={handleImportSubmit}
                disabled={!canAfford}
                variant="primary"
                fullWidth
                className="py-3.5 font-retro text-sm tracking-wider"
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
