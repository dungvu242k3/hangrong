"use client";

import React, { useState } from "react";
import { Package, Store, BadgeDollarSign, ShieldAlert, Award, TrendingUp, Info } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { Button } from "@/shared/components/Button";
import { useInventory } from "@/shared/hooks/useInventory";
import { InventoryItem } from "@/shared/types/api.types";
import { getProductVisual } from "@/shared/lib/productHelper";

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-retro text-white flex items-center gap-3 tracking-tight glow-cta">
              <Package className="w-7 h-7 text-cta animate-float" /> KHO ĐỒ CỦA BẠN
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 font-body tracking-wider uppercase">
              Quản lý nguyên liệu đã nhập. Bày bán lên sạp hoặc thanh lý nhanh cho hệ thống.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gem/40 bg-gem/5 py-2px px-4 rounded-xl text-[10px] font-semibold text-gem flex items-center gap-2">
            <Award className="w-4 h-4 text-gem animate-bounce" /> Mở khóa sạp cấp cao để chứa thêm nhiều loại hàng độc lạ!
          </div>
        </div>

        {/* 2. CATEGORY TABS */}
        <div className="flex bg-slate-950 border-2 border-slate-800 p-1 rounded-xl max-w-md font-retro text-[9px]">
          {[
            { id: "all", label: "Tất cả" },
            { id: "food", label: "Đồ Ăn" },
            { id: "drink", label: "Đồ Uống" },
            { id: "toy", label: "Đồ Chơi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === tab.id
                  ? "bg-cta text-white shadow-retro-md"
                  : "text-slate-400 hover:text-slate-200"
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
                className="bg-slate-900 border-4 border-double border-slate-700 hover:border-cta/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] rounded-xl p-5 flex flex-col justify-between gap-4 relative group cursor-pointer transition-all hover:scale-103"
              >
                {/* Quantity bubble HUD */}
                <div className="absolute -top-3 -right-2 bg-cta border-2 border-slate-900 rounded-md py-1 px-3 shadow-md text-white font-bold text-xs font-retro tracking-tighter">
                  x{item.quantity}
                </div>

                {/* Header details */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-950 border-4 border-double border-slate-800 rounded-lg flex items-center justify-center text-3.5xl shadow-inner transition-transform duration-200 group-hover:scale-110">
                    {getProductVisual(item.iconName).emoji}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-white font-pixel leading-tight">{item.name}</h4>
                    <span className="bg-slate-800 border border-slate-700 text-slate-400 font-retro text-[9px] py-0.5 px-2 rounded mt-1.5 inline-block uppercase">
                      {item.category === "food" ? "Đồ Ăn" : item.category === "drink" ? "Đồ Uống" : "Đồ Chơi"}
                    </span>
                  </div>
                </div>

                {/* Price indicators */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 gap-2 text-xs font-semibold font-pixel text-slate-400">
                  <div>
                    <p className="text-slate-500">Giá bán sạp:</p>
                    <p className="font-bold text-coin font-retro text-[10px] mt-1">
                      {item.sellPrice} Xu
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Thanh lý nhanh:</p>
                    <p className="font-bold text-slate-300 font-retro text-[10px] mt-1">
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
                    className="flex-1 text-[9px] font-retro tracking-wider py-2.5"
                  >
                    BÀY BÁN
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border-4 border-double border-slate-700 rounded-2xl p-12 text-center max-w-lg mx-auto font-body select-none">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-bounce" />
            <h4 className="text-lg font-bold text-white mb-2 font-retro glow-cta">Kho đồ trống rỗng!</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-semibold">
              Bạn chưa có nguyên liệu nào trong kho đồ. Hãy ghé ngay màn Nhập Hàng để buôn bán gánh hàng rong của mình nhé!
            </p>
            <Button
              onClick={() => (window.location.href = "/import-goods")}
              variant="primary"
              className="px-6 py-2.5 text-[10px] font-retro tracking-wider"
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
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="w-14 h-14 bg-slate-900 border-4 border-double border-slate-800 rounded-lg flex items-center justify-center text-3.5xl">
                    {getProductVisual(selectedItem.iconName).emoji}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm font-retro text-white">THÔNG SỐ KHO ĐỒ</h4>
                    <p className="text-xs font-semibold text-gem mt-1.5">Số lượng đang có: {selectedItem.quantity} cái</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">{selectedItem.description || getProductVisual(selectedItem.iconName).description}</span>
                </p>
              </div>

              {/* ACTION 1: PLACE ON STALL (CHUYỂN EVENT) */}
              <div className="border-t border-slate-850 pt-6">
                <h4 className="font-bold text-sm font-retro text-white mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-cta" /> TÙY CHỌN 1: BÀY BÁN LÊN SẠP
                </h4>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal">
                  Chuyển nguyên liệu bày lên các slot trống của sạp hàng ngoài phố để bắt đầu phục vụ khách hàng.
                </p>
                <Button
                  onClick={handlePlaceOnStall}
                  variant="primary"
                  fullWidth
                  className="py-3.5 font-retro text-[10px] tracking-wider"
                >
                  BÀY BÁN NGAY LÊN SẠP
                </Button>
              </div>

              {/* ACTION 2: FAST SELL TO SYSTEM (LIQUIDATE) */}
              <div className="border-t border-slate-850 pt-6">
                <h4 className="font-bold text-sm font-retro text-white mb-2 flex items-center gap-2">
                  <BadgeDollarSign className="w-4 h-4 text-gem" /> TÙY CHỌN 2: THANH LÝ NHANH
                </h4>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-normal">
                  Bán nhanh cho tổng kho với giá chiết khấu ({selectedItem.fastSellPrice} Xu / cái). Thu tiền xu về ví ngay lập tức.
                </p>
                
                <div className="space-y-4 bg-slate-950 border border-slate-850 rounded-xl p-4">
                  {/* Quantity slider selectors */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-400 font-retro">SỐ LƯỢNG BÁN:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSellQuantity((q) => Math.max(q - 1, 1))}
                        disabled={sellQuantity === 1}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-750 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer font-bold flex items-center justify-center text-white active:scale-95 transition-all text-base"
                      >
                        -
                      </button>
                      <span className="text-lg font-black text-white font-retro min-w-[36px] text-center">
                        {sellQuantity}
                      </span>
                      <button
                        onClick={() => setSellQuantity((q) => Math.min(q + 1, selectedItem.quantity))}
                        disabled={sellQuantity === selectedItem.quantity}
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-750 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer font-bold flex items-center justify-center text-white active:scale-95 transition-all text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-semibold text-slate-400">
                    <span>Tổng xu nhận được:</span>
                    <span className="font-bold text-gem flex items-center gap-1 text-sm font-retro">
                      +{totalGainedCoins} Xu <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleFastSellSubmit}
                  variant="secondary"
                  fullWidth
                  className="py-3.5 font-retro text-[10px] tracking-wider mt-4"
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
