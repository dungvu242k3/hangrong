"use client";

import React, { useState } from "react";
import { ClipboardList, Award, CheckCircle2, Lock, Sparkles, AlertCircle } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { Button } from "@/shared/components/Button";
import { useQuests } from "@/shared/hooks/useQuests";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { Quest } from "@/shared/types/api.types";
import { motion, AnimatePresence } from "framer-motion";

// Fallback mock quests data if backend database list is empty
const MOCK_QUESTS: Quest[] = [
  { id: "q1", title: "Bán hàng nhiệt tình", description: "Bày bán đồ ăn/uống phục vụ khách hàng vỉa hè", targetCount: 10, currentCount: 7, rewardCoins: 250, rewardGems: 5, isCompleted: false, isClaimed: false, type: "daily" },
  { id: "q2", title: "Khách trà đong đầy", description: "Bán cốc Trà Đá vỉa hè cho 5 NPC chibi", targetCount: 5, currentCount: 5, rewardCoins: 150, rewardGems: 2, isCompleted: true, isClaimed: false, type: "daily" },
  { id: "q3", title: "Vương quốc Bánh Mì", description: "Bán bánh mì pate ngào ngạt khói lò", targetCount: 20, currentCount: 12, rewardCoins: 500, rewardGems: 10, isCompleted: false, isClaimed: false, type: "main" },
  { id: "q4", title: "Trùm vỉa hè Tạ Hiện", description: "Nâng cấp sạp hàng lên Cấp 5 lừng lẫy", targetCount: 5, currentCount: 3, rewardCoins: 2000, rewardGems: 50, isCompleted: false, isClaimed: false, type: "main" },
  { id: "q5", title: "Khởi đầu buôn bán", description: "Hoàn tất đăng nhập và mở sạp gánh đầu tiên", targetCount: 1, currentCount: 1, rewardCoins: 100, rewardGems: 1, isCompleted: true, isClaimed: true, type: "main" },
];

export default function QuestsPage() {
  const { quests, claimReward, isClaimingReward } = useQuests();
  usePlayer(true);

  // Tab selections: "daily" (Nhiệm vụ ngày) or "main" (Nhiệm vụ chính)
  const [activeTab, setActiveTab] = useState<"daily" | "main">("daily");

  const enableMockFallback = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK !== "false";
  const displayQuests = quests.length > 0 ? quests : (enableMockFallback ? MOCK_QUESTS : []);
  const filteredQuests = displayQuests.filter((q) => q.type === activeTab);

  // Stats calculation
  const completedCount = displayQuests.filter((q) => q.isCompleted && !q.isClaimed).length;

  return (
    <GameShell>
      <div className="space-y-8 select-none">
        
        {/* 1. Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-cta animate-float" /> Sổ Tay Nhiệm Vụ
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Hoàn thành các mốc buôn bán vỉa hè để nhận thưởng Xu vàng và Kim cương quý.
            </p>
          </div>

          {completedCount > 0 && (
            <div className="bg-gem/10 border border-gem/25 py-2.5 px-4 rounded-2xl text-xs font-bold text-gem flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4.5 h-4.5" /> Có {completedCount} phần thưởng đang đợi bạn nhận!
            </div>
          )}
        </div>

        {/* 2. TAB TOGGLE */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-sm">
          {[
            { id: "daily", label: "Nhiệm Vụ Hàng Ngày" },
            { id: "main", label: "Nhiệm Vụ Chính Tuyến" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. QUESTS RENDERING */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {filteredQuests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredQuests.map((quest, index) => {
                  const percent = Math.min((quest.currentCount / quest.targetCount) * 100, 100);
                  const isReady = quest.isCompleted && !quest.isClaimed;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ delay: index * 0.05, type: "spring", damping: 25 }}
                      key={quest.id}
                      className={`bg-white border-2 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
                        isReady
                          ? "border-gem bg-gem/2 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : quest.isClaimed
                          ? "opacity-60 border-slate-200"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Quest Info */}
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-start justify-between md:justify-start gap-3">
                          <div>
                            <h4 className="font-bold text-lg text-slate-800 leading-snug flex items-center gap-2">
                              {quest.isClaimed ? (
                                <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                              ) : isReady ? (
                                <Sparkles className="w-5 h-5 text-gem animate-pulse shrink-0" />
                              ) : (
                                <Award className="w-5 h-5 text-cta shrink-0" />
                              )}
                              {quest.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">{quest.description}</p>
                          </div>

                          <span className="bg-slate-100 border border-slate-200 text-slate-600 font-retro text-[9px] py-1 px-3 rounded-full shadow-xs">
                            {quest.currentCount}/{quest.targetCount}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full space-y-1.5">
                          <div className="w-full h-3 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden p-0.5 relative">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isReady
                                  ? "bg-gem shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                  : "bg-linear-to-r from-cta to-[#EAB308]"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reward Info & CTA Trigger */}
                      <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        {/* Rewards badges */}
                        <div className="flex items-center gap-3">
                          {quest.rewardCoins > 0 && (
                            <div className="flex items-center gap-1 bg-[#EAB308]/5 border border-[#EAB308]/20 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                              <span>💰</span> {quest.rewardCoins}
                            </div>
                          )}
                          {quest.rewardGems > 0 && (
                            <div className="flex items-center gap-1 bg-gem/5 border border-gem/20 px-3 py-1.5 rounded-xl text-xs font-bold text-[#10B981]">
                              <span>💎</span> {quest.rewardGems}
                            </div>
                          )}
                        </div>

                        {/* CTA button */}
                        {quest.isClaimed ? (
                          <span className="bg-slate-100 border border-slate-200 text-slate-400 py-2.5 px-6 rounded-xl text-xs font-retro tracking-wide select-none min-h-[44px] flex items-center justify-center">
                            ĐÃ NHẬN
                          </span>
                        ) : isReady ? (
                          <Button
                            onClick={() => claimReward(quest.id)}
                            disabled={isClaimingReward}
                            variant="primary"
                            size="sm"
                            className="font-retro text-[10px] tracking-wider py-2.5 px-6 min-h-[44px] shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse"
                          >
                            NHẬN THƯỞNG
                          </Button>
                        ) : (
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 py-2.5 px-6 rounded-xl text-xs font-retro tracking-wide flex items-center gap-1.5 select-none min-h-[44px]">
                            <Lock className="w-3.5 h-3.5" /> CHƯA XONG
                          </span>
                        )}
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center max-w-lg mx-auto font-body select-none">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-xl font-bold text-slate-700 mb-1.5 font-heading">Trống rỗng!</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                  Hiện tại không có nhiệm vụ nào sẵn sàng trong danh mục này. Hãy quay lại sạp hàng buôn bán để kích hoạt nhé!
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </GameShell>
  );
}
