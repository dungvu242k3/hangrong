"use client";

import React, { useState } from "react";
import { Package, Store, BadgeDollarSign, ShieldAlert, Award, TrendingUp, Info } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { useInventory } from "@/shared/hooks/useInventory";
import { InventoryItem } from "@/shared/types/api.types";

// Fallback mock items data if inventory query is empty
const OWNED_ITEMS: InventoryItem[] = [
  { id: "i1", productId: "p1", name: "Bánh Mì Pate", category: "food", quantity: 35, sellPrice: 150, fastSellPrice: 100, iconName: "🥖", color: "bg-amber-100 border-amber-300", description: "Bánh mì đặc sản pate gan siêu thơm bơ, món đắt khách nhất vỉa hè." },
  { id: "i2", productId: "p2", name: "Trà Đá Vỉa Hè", category: "drink", quantity: 80, sellPrice: 50, fastSellPrice: 35, iconName: "🍵", color: "bg-teal-100 border-teal-300", description: "Cốc trà đá giải nhiệt ngày hè nóng bức, xoá tan cơn khát tức thì." },
  { id: "i3", productId: "p3", name: "Bánh Tráng Trộn", category: "food", quantity: 12, sellPrice: 300, fastSellPrice: 200, iconName: "🥗", color: "bg-orange-100 border-orange-300", description: "Bánh tráng trộn bò khô, trứng cút, xoài xanh chua ngọt siêu dính." },
  { id: "i4", productId: "p4", name: "Nước Mía Siêu Sạch", category: "drink", quantity: 5, sellPrice: 130, fastSellPrice: 90, iconName: "🍹", color: "bg-emerald-100 border-emerald-300", description: "Nước mía vắt chanh chua ngọt mát lạnh, ép tươi tại chỗ." },
];

export default function InventoryPage() {
  const { inventoryItems, fastSell } = useInventory();
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<"all" | "food" | "drink" | "toy">("all");
  
  // Selected Item Context
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sellQuantity, setSellQuantity] = useState(1);

  const enableMockFallback = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK !== "false";
  // Fallback to mock items if real warehouse database is empty
  const activeInventory = inventoryItems.length > 0 ? inventoryItems : (enableMockFallback ? OWNED_ITEMS : []);

  // Filter items based on active tab
  const filteredItems = activeInventory.filter((item) => {
    if (activeTab === "all") return true;
    return item.category === activeTab;
  });

  // Handle open selector sheet
  const handleOpenSheet = (item: InventoryItem) => {
    setSelectedItem(item);
    setSellQuantity(1);
    setIsSheetOpen(true);
  };

  // Fast sell calculation
  const totalGainedCoins = selectedItem ? selectedItem.fastSellPrice * sellQuantity : 0;

  // Fast Sell Action
  const handleFastSellSubmit = () => {
    if (!selectedItem || selectedItem.quantity < sellQuantity) return;
    
    fastSell(
      { productId: selectedItem.productId, quantity: sellQuantity },
      {
        onSuccess: (res) => {
          if (res.success) {
            setIsSheetOpen(false);
            setSelectedItem(null);
          }
        },
      }
    );
  };

  // Place on Stall Navigation Shortcut
  const handlePlaceOnStall = () => {
    if (!selectedItem) return;
    // Redirect to stall page to interactively place it
    window.location.href = "/stall";
  };

  return (
    <GameShell>
      <div className="space-y-8 select-none">
        {/* 1. Page Header description */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-cta" /> Kho Đồ Của Bạn
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Quản lý nguyên liệu đã nhập. Bày bán lên sạp hoặc thanh lý nhanh cho hệ thống.
            </p>
          </div>
          
          <div className="bg-gem/5 border border-gem/10 py-2 px-4 rounded-2xl text-xs font-semibold text-gem flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-gem animate-bounce" /> Mở khóa sạp cấp cao để chứa thêm nhiều loại hàng độc lạ!
          </div>
        </div>

        {/* 2. CATEGORY TABS */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-md">
          {[
            { id: "all", label: "Tất cả" },
            { id: "food", label: "Đồ Ăn" },
            { id: "drink", label: "Đồ Uống" },
            { id: "toy", label: "Đồ Chơi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. INVENTORY ITEMS GRID */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenSheet(item)}
                className="card-retro flex flex-col justify-between gap-4 border-slate-200 hover:border-cta/40 relative group"
              >
                {/* Quantity bubble HUD */}
                <div className="absolute -top-3.5 -right-2 bg-linear-to-br from-[#EAB308] to-cta border-2 border-white rounded-2xl py-1 px-3 shadow-md text-white font-bold text-xs font-retro tracking-tighter">
                  x{item.quantity}
                </div>

                {/* Header details */}
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3.5xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${item.color}`}>
                    {item.iconName}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 leading-tight">{item.name}</h4>
                    <span className="bg-slate-100 text-slate-500 font-bold border border-slate-200 py-0.5 px-2 rounded-full text-[10px] uppercase mt-1 inline-block">
                      {item.category === "food" ? "Đồ Ăn" : "Đồ Uống"}
                    </span>
                  </div>
                </div>

                {/* Price indicators */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs font-semibold font-body">
                  <div>
                    <p className="text-slate-400">Giá bán sạp:</p>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {item.sellPrice} Xu
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Thanh lý nhanh:</p>
                    <p className="font-bold text-slate-500 mt-0.5">
                      {item.fastSellPrice} Xu
                    </p>
                  </div>
                </div>

                {/* Action buttons preview */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {}} // Controlled by outer Card onClick
                    variant="primary"
                    size="sm"
                    className="flex-1 text-[10px] font-retro tracking-wider py-2.5"
                  >
                    BÀY BÁN
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center max-w-lg mx-auto font-body select-none">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-slate-700 mb-1.5 font-heading">Kho đồ trống rỗng!</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-semibold">
              Bạn chưa có nguyên liệu nào trong kho đồ. Hãy ghé ngay màn Nhập Hàng để buôn bán gánh hàng rong của mình nhé!
            </p>
            <Button
              onClick={() => (window.location.href = "/import-goods")}
              variant="primary"
              className="px-6 py-2.5 text-xs font-retro tracking-wider"
            >
              ĐI NHẬP HÀNG NGAY
            </Button>
          </div>
        )}

        {/* 4. DETAILS & ACTIONS BOTTOM SHEET */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title={selectedItem?.name}
        >
          {selectedItem && (
            <div className="space-y-6 select-none font-body">
              {/* Brief details & Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 p-4 rounded-2xl">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-3.5xl">
                    {selectedItem.iconName}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">Thông số kho đồ</h4>
                    <p className="text-xs font-semibold text-gem">Số lượng đang có: {selectedItem.quantity} cái</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 leading-relaxed bg-[#F8FAFC] border-2 border-slate-200 rounded-2xl p-4 flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="font-semibold">{selectedItem.description}</span>
                </p>
              </div>

              {/* ACTION 1: PLACE ON STALL (CHUYỂN EVENT) */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-cta" /> Tùy chọn 1: Bày bán lên sạp
                </h4>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal">
                  Chuyển nguyên liệu bày lên các slot trống của sạp hàng ngoài phố để bắt đầu phục vụ khách hàng.
                </p>
                <Button
                  onClick={handlePlaceOnStall}
                  variant="primary"
                  fullWidth
                  className="py-3.5 font-retro text-xs tracking-wider"
                >
                  BÀY BÁN NGAY LÊN SẠP
                </Button>
              </div>

              {/* ACTION 2: FAST SELL TO SYSTEM (LIQUIDATE) */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
                  <BadgeDollarSign className="w-5 h-5 text-gem" /> Tùy chọn 2: Thanh lý nhanh cho hệ thống
                </h4>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal">
                  Bán nhanh cho tổng kho với giá chiết khấu ({selectedItem.fastSellPrice} Xu / cái). Thu tiền xu về ví ngay lập tức.
                </p>
                
                <div className="space-y-4 bg-slate-100 border border-slate-200 rounded-3xl p-4">
                  {/* Quantity slider selectors */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-600">Số lượng bán:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSellQuantity((q) => Math.max(q - 1, 1))}
                        disabled={sellQuantity === 1}
                        className="w-10 h-10 bg-white hover:bg-slate-200 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer font-bold flex items-center justify-center text-slate-600 active:scale-95 transition-all text-base"
                      >
                        -
                      </button>
                      <span className="text-lg font-black text-slate-800 font-retro min-w-[36px] text-center">
                        {sellQuantity}
                      </span>
                      <button
                        onClick={() => setSellQuantity((q) => Math.min(q + 1, selectedItem.quantity))}
                        disabled={sellQuantity === selectedItem.quantity}
                        className="w-10 h-10 bg-white hover:bg-slate-200 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer font-bold flex items-center justify-center text-slate-600 active:scale-95 transition-all text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-600">
                    <span>Tổng xu nhận được:</span>
                    <span className="font-bold text-gem flex items-center gap-1 text-base">
                      +{totalGainedCoins} Xu <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleFastSellSubmit}
                  variant="secondary"
                  fullWidth
                  className="py-3.5 font-retro text-xs tracking-wider mt-4"
                >
                  XÁC NHẬN THANH LÝ
                </Button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </GameShell>
  );
}
