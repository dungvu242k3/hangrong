import EventEmitter from "eventemitter3";
import { StallSlot } from "../../shared/types/api.types";

// Strongly-typed event structures
export interface GameEvents {
  // React -> PixiJS Events
  "react:place_product": (data: {
    slotId: string;
    productId: string;
    name: string;
    iconName: string;
    durationSeconds: number;
    coinsReward: number;
  }) => void;
  "react:collect_all": () => void;
  "react:sync_slots": (data: { slots: Partial<StallSlot>[]; stallLevel: number }) => void;
  "react:upgrade_stall": (data: { newLevel: number }) => void;
  "react:help_stall": () => void;
  "react:prank_stall": () => void;
  "react:toggle_music": (enabled: boolean) => void;

  // PixiJS -> React Events
  "game:slot_clicked": (data: {
    slotId: string;
    isEmpty: boolean;
    hasProduct: boolean;
    isReadyToCollect: boolean;
    productName?: string;
  }) => void;
  "game:coin_collected": (data: { slotId: string; amount: number }) => void;
  "game:xp_gained": (data: { amount: number }) => void;
  "game:tutorial_trigger": (step: number) => void;
}

class GameEventEmitter extends EventEmitter<GameEvents> {
  private static instance: GameEventEmitter;

  private constructor() {
    super();
  }

  public static getInstance(): GameEventEmitter {
    if (!GameEventEmitter.instance) {
      GameEventEmitter.instance = new GameEventEmitter();
    }
    return GameEventEmitter.instance;
  }
}

export const gameEmitter = GameEventEmitter.getInstance();
export default gameEmitter;
