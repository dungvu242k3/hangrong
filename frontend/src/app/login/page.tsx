"use client";

import React, { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Mail, Volume2, VolumeX, Store, ArrowRight, ArrowLeft } from "lucide-react";
import { useUiStore } from "@/shared/stores/uiStore";
import { Button } from "@/shared/components/Button";
import { useAuth } from "@/shared/hooks/useAuth";

// Class for Retro arcade scanlines
const ScanlineOverlay: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-size-[100%_4px,6px_100%]" />
);

export default function LoginPage() {
  const { login, register, isLoadingLogin, isLoadingRegister, loginError, registerError } = useAuth();
  
  // UI states
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: Start Screen, 1: Story, 2: Form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Typewriter effect state for storytelling
  const [typedText, setTypedText] = useState("");
  const fullStoryText = "Hà Nội, những năm 2000...\nTiếng còi tàu điện keng keng qua phố cổ.\nGánh hàng rong nhỏ nghi ngút khói bánh mì nướng...\nBạn, một thanh niên trẻ với giấc mơ khởi nghiệp lớn,\nsẽ dẫn dắt gánh hàng rong của mình trở thành thương hiệu lừng lẫy vỉa hè phố cổ!\n\nHãy chèn xu để BẮT ĐẦU hành trình...";

  // Global sound state from Zustand store
  const { soundEnabled, toggleSound } = useUiStore();

  // Typewriter effect logic
  useEffect(() => {
    if (currentStep === 1) {
      let index = 0;
      const timer = setInterval(() => {
        setTypedText((prev) => {
          if (index === 0) return "";
          return prev + fullStoryText.charAt(index - 1);
        });
        index++;
        if (index > fullStoryText.length) {
          clearInterval(timer);
        }
      }, 35);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  // Form Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!username || username.length < 3) {
      newErrors.username = "Tên đăng nhập phải chứa ít nhất 3 ký tự.";
    }
    if (!isLogin) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Vui lòng nhập địa chỉ Email hợp lệ.";
      }
    }
    if (!password || password.length < 6) {
      newErrors["password"] = "Mật khẩu phải chứa ít nhất 6 ký tự.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit flow
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (isLogin) {
      login({ username, password });
    } else {
      register({ username, email, password });
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body text-slate-100 selection:bg-cta selection:text-white">
      {/* CRT Scanline Filter applied universally on auth */}
      <ScanlineOverlay />

      {/* Decorative Chibi Elements & Background stars grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-10" />
      
      {/* Sound Toggle HUD */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleSound}
          className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-700/80 transition-all hover:scale-105"
          aria-label="Tắt/Bật âm thanh"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-cta" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      <div className="w-full max-w-lg z-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: Classic Arcade Start Screen */}
          {currentStep === 0 && (
            <motion.div
              key="start"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="flex flex-col items-center text-center"
            >
              {/* Retro Glowing Title */}
              <div className="relative mb-8">
                <Store className="w-24 h-24 text-cta mx-auto drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-bounce" />
                <h1 className="text-7xl font-heading text-cta mt-4 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] select-none">
                  Hàng Rong
                </h1>
                <p className="font-retro text-xs tracking-widest text-secondary mt-2 select-none uppercase">
                  Phố Cổ Ký Sự
                </p>
              </div>

              {/* Blinking Push Start Indicator */}
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-12 cursor-pointer"
                onClick={() => setCurrentStep(1)}
              >
                <span className="font-retro text-[#EAB308] text-sm tracking-wide bg-[#EAB308]/10 py-3 px-6 rounded-2xl border-2 border-dashed border-[#EAB308]">
                  [ NHẤP VÀO ĐỂ BẮT ĐẦU ]
                </span>
              </motion.div>

              {/* Street background detail */}
              <p className="text-slate-500 font-pixel text-lg">
                Phiên bản di động V3.0 (C) 2026
              </p>
            </motion.div>
          )}

          {/* STEP 1: Storytelling scroll sequence */}
          {currentStep === 1 && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-8 shadow-2xl relative w-full max-w-md mx-auto"
            >
              <h2 className="font-retro text-cta text-sm mb-6 uppercase tracking-wider">
                Nhật Ký Hàng Rong
              </h2>
              
              {/* Typewriter scrolling viewport */}
              <div className="min-h-[220px] font-pixel text-2xl text-slate-300 whitespace-pre-line leading-relaxed mb-8">
                {typedText}
                <span className="animate-pulse ml-1 text-cta font-bold">|</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* Skip button */}
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-slate-400 font-retro hover:text-slate-200 cursor-pointer transition-colors"
                >
                  Bỏ Qua Truyện
                </button>

                {/* Continue button */}
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="primary"
                  className="font-retro text-xs tracking-wider"
                >
                  Nhập Sạp Hàng <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: The actual Login & Registration form */}
          {currentStep === 2 && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-8 shadow-2xl relative max-w-md w-full mx-auto"
            >
              {/* Back to story */}
              <button
                onClick={() => setCurrentStep(1)}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Trở lại
              </button>

              {/* Title Form */}
              <div className="text-center mb-8 mt-4">
                <h2 className="text-5xl font-heading text-cta drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                  {isLogin ? "Đăng Nhập Sạp" : "Mở Sạp Mới"}
                </h2>
                <p className="text-xs text-slate-400 font-retro uppercase tracking-wider mt-2">
                  {isLogin ? "Nhập thông tin bán hàng" : "Điền thông tin đăng ký"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 font-retro uppercase tracking-wider mb-2">
                    Tên bán hàng
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ví dụ: banhmianhbac"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-2xl py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-all font-body text-base"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.username}</p>
                  )}
                </div>

                {/* Email Input (Register only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 font-retro uppercase tracking-wider mb-2">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="w-full bg-slate-800/80 border border-slate-600 rounded-2xl py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-all font-body text-base"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.email}</p>
                    )}
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 font-retro uppercase tracking-wider mb-2">
                    Mật khẩu sạp
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-2xl py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-all font-body text-base"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.password}</p>
                  )}
                </div>

                {/* API Submit Error Alert */}
                {(loginError || registerError) && (
                  <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl">
                    {loginError || registerError}
                  </p>
                )}

                {/* Action button Submit */}
                <Button
                  type="submit"
                  loading={isLogin ? isLoadingLogin : isLoadingRegister}
                  fullWidth
                  variant="primary"
                  className="py-3.5 text-base font-retro tracking-widest mt-2"
                >
                  {isLogin ? "BẮT ĐẦU BUÔN BÁN" : "ĐĂNG KÝ GÁNH HÀNG"}
                </Button>

                {/* Register/Login switch state toggle */}
                <div className="text-center pt-4 border-t border-slate-700/50 mt-4 text-sm">
                  <span className="text-slate-400">
                    {isLogin ? "Chưa có sạp hàng ở đây?" : "Đã đăng ký sạp hàng trước đó?"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className="text-cta hover:text-[#EA580C] ml-2 font-bold cursor-pointer hover:underline transition-all"
                  >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
