"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Package, Import, Users, ClipboardList, Settings, Volume2, VolumeX } from "lucide-react";
import { useUiStore } from "@/shared/stores/uiStore";
import { CoinBadge } from "./CoinBadge";
import { GemBadge } from "./GemBadge";
import { LevelProgress } from "./LevelProgress";
import { usePlayer } from "@/shared/hooks/usePlayer";

interface GameShellProps {
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Real dynamic player profile state
  const { player } = usePlayer(true);

  // State from Zustand store
  const { soundEnabled, toggleSound } = useUiStore();

  // Dynamic player values falling back gracefully
  const stats = {
    level: player?.level ?? 1,
    currentXp: player?.currentXp ?? 0,
    maxXp: player?.maxXp ?? 100,
    coins: player?.coins ?? 0,
    gems: player?.gems ?? 0,
  };

  // Nav menu items definition
  const menuItems = [
    { name: "Sạp hàng", path: "/stall", icon: Store },
    { name: "Kho đồ", path: "/inventory", icon: Package },
    { name: "Nhập hàng", path: "/import-goods", icon: Import },
    { name: "Nhiệm vụ", path: "/quests", icon: ClipboardList },
    { name: "Bạn bè", path: "/friends", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-body text-slate-100 relative selection:bg-cta selection:text-white pb-24 md:pb-6 md:pl-64 crt-overlay">
      {/* 1. TOP BAR (HUD) */}
      <header className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-2.5 px-4 md:px-8 flex flex-row items-center justify-between gap-3 shadow-md select-none">
        {/* Left Side: Avatar & Level */}
        <div className="flex items-center gap-3">
          <LevelProgress
            level={stats.level}
            currentXp={stats.currentXp}
            maxXp={stats.maxXp}
          />
        </div>

        {/* Right Side: Currency Badges & Settings */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <CoinBadge amount={stats.coins} />
          <GemBadge amount={stats.gems} />
          
          {/* Universal Sound Toggle HUD */}
          <button
            onClick={toggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all hover:scale-105"
            aria-label="Tắt/Bật nhạc"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cta" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Settings Shortcut HUD */}
          <Link
            href="/settings"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all hover:scale-105 flex items-center justify-center"
            aria-label="Cài đặt"
          >
            <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </Link>
        </div>
      </header>


      {/* 2. SIDEBAR NAVIGATION FOR DESKTOP */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex-col z-40">
        {/* Brand/Title */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Store className="w-8 h-8 text-cta drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] animate-bounce" />
          <div>
            <h1 className="text-3xl font-heading text-cta select-none">Hàng Rong</h1>
            <p className="font-retro text-[8px] tracking-wider text-secondary uppercase select-none">
              Phố Cổ Ký Sự
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-cta text-white shadow-retro-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500 group-hover:text-cta"}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/settings"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-500" />
            <span className="text-sm">Cài đặt</span>
          </Link>
        </div>
      </aside>

      {/* 3. MAIN SCROLLABLE VIEWPORT CONTENT */}
      <main className="grow p-4 md:p-8 max-w-5xl w-full mx-auto animate-fade-in">
        {children}
      </main>

      {/* 4. BOTTOM NAVIGATION FOR MOBILE DEVICES */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-2 py-2 flex justify-around items-center select-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center gap-1 py-1 px-3 cursor-pointer group transition-all"
              style={{ minWidth: "64px" }}
            >
              <span
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-cta text-white shadow-retro-md scale-105"
                    : "text-slate-400 group-hover:text-cta group-hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight transition-colors duration-200 ${
                  isActive ? "text-cta" : "text-slate-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};
export default GameShell;
