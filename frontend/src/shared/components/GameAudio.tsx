"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useUiStore } from "@/shared/stores/uiStore";
import { gameEmitter } from "@/game/events/gameEmitter";

export const GameAudio: React.FC = () => {
  const { soundEnabled } = useUiStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API context
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    return audioCtxRef.current;
  }, []);

  // Synthesize short retro sound effects using simple square/triangle oscillators
  const playRetroTone = useCallback((
    freqs: number[],
    durations: number[],
    type: OscillatorType = "sine",
    volume = 0.08
  ) => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser security policies)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    let time = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(volume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + durations[idx]);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + durations[idx]);

      time += durations[idx] * 0.8; // overlap notes slightly
    });
  }, [soundEnabled, getAudioContext]);

  // 1. Synthesize retro C-Major pentatonic cute background tune arpeggio
  const playBackgroundArpeggio = useCallback(() => {
    if (!soundEnabled) return;
    
    // Pentatonic scale Hanoi casual theme loop notes (C4, D4, E4, G4, A4, C5)
    const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const duration = 0.25;

    // Pick 4 random notes to arpeggiate quietly
    const notes: number[] = [];
    const durs: number[] = [];
    for (let i = 0; i < 4; i++) {
      const randomNote = melody[Math.floor(Math.random() * melody.length)];
      notes.push(randomNote);
      durs.push(duration);
    }

    playRetroTone(notes, durs, "sine", 0.008); // very quiet ambient arpeggio
  }, [soundEnabled, playRetroTone]);

  // Setup loop for background arpeggio music
  useEffect(() => {
    if (soundEnabled) {
      // Tick arpeggiator every 2.5s for slow pleasant retro melody background
      musicIntervalRef.current = setInterval(playBackgroundArpeggio, 2500);
      playBackgroundArpeggio();
    } else {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
    }

    return () => {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
      }
    };
  }, [soundEnabled, playBackgroundArpeggio]);

  // Hook game event listeners for sound effects
  useEffect(() => {
    // A. Coin Harvest Sound: Quick arpeggio beep (8-bit ring)
    const handleCoinCollected = () => {
      playRetroTone([523.25, 659.25, 783.99, 1046.50], [0.08, 0.08, 0.08, 0.15], "triangle", 0.05);
    };

    // B. Place Product Sound: Cute downward bubble glide
    const handlePlaceProduct = () => {
      playRetroTone([392.00, 329.63, 261.63], [0.1, 0.1, 0.15], "sine", 0.06);
    };

    // C. Upgrade / Achievement Sound: Proud major chord arpeggio
    const handleUpgradeStall = () => {
      playRetroTone([261.63, 329.63, 392.00, 523.25, 659.25, 783.99], [0.1, 0.1, 0.1, 0.1, 0.1, 0.3], "triangle", 0.08);
    };

    gameEmitter.on("game:coin_collected", handleCoinCollected);
    gameEmitter.on("react:place_product", handlePlaceProduct);
    gameEmitter.on("react:upgrade_stall", handleUpgradeStall);
    gameEmitter.on("react:help_stall", handleUpgradeStall); // Help also plays upgrade sound
    gameEmitter.on("react:prank_stall", handlePlaceProduct); // Prank also plays down glide

    return () => {
      gameEmitter.off("game:coin_collected", handleCoinCollected);
      gameEmitter.off("react:place_product", handlePlaceProduct);
      gameEmitter.off("react:upgrade_stall", handleUpgradeStall);
      gameEmitter.off("react:help_stall", handleUpgradeStall);
      gameEmitter.off("react:prank_stall", handlePlaceProduct);
    };
  }, [soundEnabled, playRetroTone]);

  return null; // Silent render component
};

export default GameAudio;
