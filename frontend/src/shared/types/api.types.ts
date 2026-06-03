// strict type definitions for Hàng Rong game APIs

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  coins: number;
  gems: number;
  level: number;
  currentXp: number;
  maxXp: number;
  stallLevel: number;
}

export interface Product {
  id: string;
  name: string;
  category: "food" | "drink" | "toy";
  importPrice: number;
  sellPrice: number;
  timeSeconds: number;
  levelRequired: number;
  iconName: string;
  color: string;
}

export interface ImportOrder {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  timeRemaining: number;
  totalTime: number;
  status: "pending" | "completed" | "claimed";
}

export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  category: "food" | "drink" | "toy";
  quantity: number;
  sellPrice: number;
  fastSellPrice: number;
  iconName: string;
  color: string;
  description: string;
}

export interface StallSlot {
  id: string;
  productId: string | null;
  productName: string | null;
  productIcon: string | null;
  timeRemaining: number;
  totalTime: number;
  isReadyToCollect: boolean;
  coinsReward: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCoins: number;
  rewardGems: number;
  isCompleted: boolean;
  isClaimed: boolean;
  type: "daily" | "main";
}

export interface Friend {
  id: string;
  username: string;
  level: number;
  coins: number;
  avatarUrl?: string;
  stallName: string;
  canHelp: boolean;
  canPrank: boolean;
}
