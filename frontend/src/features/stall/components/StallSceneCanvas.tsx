"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createGameApp } from "@/game/engine/createGameApp";
import { StallScene } from "@/game/scenes/StallScene";

export const StallSceneCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let destroyApp: (() => void) | null = null;
    let sceneInstance: StallScene | null = null;

    const initPixi = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setInitError(null);

        // 1. Initialize the PixiJS App
        const { app, destroy } = await createGameApp(containerRef.current);
        destroyApp = destroy;

        // 2. Instantiate our gorgeous Stall Scene drawing layers
        sceneInstance = new StallScene(app.stage);

        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize PixiJS Game:", err);
        setInitError(
          "Không thể khởi động động cơ WebGL game. Vui lòng tải lại trang hoặc kiểm tra cấu hình thiết bị."
        );
        setLoading(false);
      }
    };

    initPixi();

    // 3. Clean up on unmount (Strictly prevents memory leaks in Single Page routing!)
    return () => {
      if (sceneInstance) {
        sceneInstance.destroy();
      }
      if (destroyApp) {
        destroyApp();
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video md:aspect-16/10 bg-[#F1F5F9] border-2 border-slate-900/15 rounded-3xl overflow-hidden shadow-retro-lg select-none">
      {/* Dynamic CRT scanline overlay filter for retro arcade feel */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.06)_50%),linear-gradient(90deg,rgba(255,0,0,0.015),rgba(0,255,0,0.01),rgba(0,0,255,0.015))] bg-size-[100%_4px,6px_100%]" />

      {/* Loading overlay spinner */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center justify-center gap-3 font-body text-slate-600 font-semibold text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-cta" />
          <span>Đang dọn sạp hàng ra phố...</span>
        </div>
      )}

      {/* Fail safe error alert overlay */}
      {initError && (
        <div className="absolute inset-0 z-30 bg-red-50 p-6 flex flex-col items-center justify-center text-center gap-3 font-body">
          <p className="text-red-600 font-bold max-w-sm text-sm md:text-base leading-normal">
            {initError}
          </p>
        </div>
      )}

      {/* The actual target DIV container where PixiJS canvas appends */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default StallSceneCanvas;
