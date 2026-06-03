"use client";

import React, { useState, useEffect } from "react";
import { Settings, Volume2, VolumeX, LogOut, User, Mail, Shield, Info, Sparkles } from "lucide-react";
import { GameShell } from "@/shared/components/GameShell";
import { Button } from "@/shared/components/Button";
import { usePlayer } from "@/shared/hooks/usePlayer";
import { useAuth } from "@/shared/hooks/useAuth";

export default function SettingsPage() {
  const { player } = usePlayer(true);
  const { logout } = useAuth();

  // Load sound configurations from localStorage
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBgm = localStorage.getItem("hr_bgm") !== "false";
      const savedSfx = localStorage.getItem("hr_sfx") !== "false";
      setBgmEnabled(savedBgm);
      setSfxEnabled(savedSfx);
    }
  }, []);

  const toggleBgm = () => {
    const newVal = !bgmEnabled;
    setBgmEnabled(newVal);
    localStorage.setItem("hr_bgm", String(newVal));
    // Dispatch sound configuration event if audio controllers exist
    window.dispatchEvent(new CustomEvent("hr:sound_config", { detail: { bgm: newVal, sfx: sfxEnabled } }));
  };

  const toggleSfx = () => {
    const newVal = !sfxEnabled;
    setSfxEnabled(newVal);
    localStorage.setItem("hr_sfx", String(newVal));
    window.dispatchEvent(new CustomEvent("hr:sound_config", { detail: { bgm: bgmEnabled, sfx: newVal } }));
  };

  // Percent calculation for XP bar
  const xpPercent = player ? Math.min((Number(player.currentXp) / Number(player.maxXp)) * 100, 100) : 0;

  return (
    <GameShell>
      <div className="space-y-8 select-none">
        
        {/* 1. Page Header */}
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-4xl font-bold font-heading text-slate-800 flex items-center gap-2">
            <Settings className="w-8 h-8 text-cta animate-spin-slow" /> Cấu Hình Trò Chơi
          </h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Điều chỉnh cài đặt âm thanh, quản lý tài khoản người chơi và xem thông tin phiên bản.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Account Profile */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Account Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2.5">
                <User className="w-5 h-5 text-cta" /> Tài Khoản Người Chơi
              </h3>

              {player ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-cta to-[#EAB308] flex items-center justify-center text-white text-2xl font-retro shadow-md shrink-0">
                      Lv.{player.level}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        {player.displayName}
                        <span className="bg-cta/10 text-cta text-[10px] font-retro py-0.5 px-2.5 rounded-full">
                          {player.role === "admin" ? "ADMIN" : "PLAYER"}
                        </span>
                      </h4>
                      <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {player.email}
                      </p>
                    </div>
                  </div>

                  {/* Level & XP Progression */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Cấp độ: {player.level}</span>
                      <span>Kinh nghiệm: {player.currentXp} / {player.maxXp} XP</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5 relative">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-cta to-[#EAB308] transition-all duration-500"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Wallet stats quick info */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <span className="block text-slate-400 text-[10px] font-bold">TÀI SẢN XU VÀNG</span>
                      <span className="text-lg font-retro text-slate-700 mt-0.5 block">💰 {player.coins.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <span className="block text-slate-400 text-[10px] font-bold">KIM CƯƠNG QUÝ</span>
                      <span className="text-lg font-retro text-gem mt-0.5 block">💎 {player.gems.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm font-semibold">
                  Đang tải thông tin tài khoản...
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <Button
                  onClick={logout}
                  variant="danger"
                  className="font-retro text-[10px] tracking-wider py-3 px-6 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> ĐĂNG XUẤT TÀI KHOẢN
                </Button>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-cta" /> Cài Đặt Âm Thanh
              </h3>

              <div className="space-y-4">
                {/* BGM Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-slate-800">Nhạc nền (BGM)</h4>
                    <p className="text-xs text-slate-400 font-semibold">Bật/tắt nhạc nền thư giãn của trò chơi</p>
                  </div>
                  <button
                    onClick={toggleBgm}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                      bgmEnabled ? "bg-cta" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        bgmEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    >
                      {bgmEnabled ? <Volume2 className="w-3.5 h-3.5 text-cta" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                </div>

                {/* SFX Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-slate-800">Hiệu ứng âm thanh (SFX)</h4>
                    <p className="text-xs text-slate-400 font-semibold">Âm thanh click nút bấm, bày hàng, thu tiền</p>
                  </div>
                  <button
                    onClick={toggleSfx}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                      sfxEnabled ? "bg-cta" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        sfxEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    >
                      {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-cta" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Game Info */}
          <div className="space-y-6">
            
            {/* Version & Info Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2.5">
                <Info className="w-5 h-5 text-cta" /> Thông Tin Trò Chơi
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Tên Trò Chơi</span>
                  <span className="font-bold text-slate-800">Hàng Rong Remix</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Phiên Bản</span>
                  <span className="font-bold text-slate-800 font-retro text-[10px]">v1.2.0-prod</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Máy Chủ</span>
                  <span className="font-bold text-gem flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-gem rounded-full animate-ping" /> Đang Kết Nối
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Động Cơ Đồ Họa</span>
                  <span className="font-bold text-slate-800">Pixi.js v8 + React</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Bản Quyền</span>
                  <span className="font-bold text-slate-800">© 2026 Hang Rong Team</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lấy cảm hứng từ</p>
                <h5 className="font-bold text-slate-700 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-cta shrink-0" /> Game Hàng Rong ZingMe 2011
                </h5>
              </div>
            </div>

            {/* Support/Security */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cta" /> Chính Sách & Bảo Mật
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Tài khoản của bạn được bảo mật hoàn toàn bằng chuỗi mã hóa ký JWT chuẩn ngành. Mật khẩu được băm bằng thuật toán bảo mật Bcrypt trên máy chủ PostgreSQL.
              </p>
            </div>

          </div>

        </div>

      </div>
    </GameShell>
  );
}
