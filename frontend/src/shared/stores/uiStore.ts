import { create } from "zustand";

interface UiState {
  // Modal & Sheet Open States
  isImportModalOpen: boolean;
  isPlaceProductSheetOpen: boolean;
  isSettingsOpen: boolean;
  isQuestOpen: boolean;
  isFriendListOpen: boolean;
  
  // Selected Context Items
  selectedSlotId: string | null;
  selectedProductId: string | null;
  
  // Audio Preferences
  soundEnabled: boolean;
  
  // Tutorial/Onboarding Steps
  tutorialStep: number;
  isTutorialActive: boolean;

  // Actions/Setters
  setImportModalOpen: (open: boolean) => void;
  setPlaceProductSheetOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setQuestOpen: (open: boolean) => void;
  setFriendListOpen: (open: boolean) => void;
  
  setSelectedSlotId: (slotId: string | null) => void;
  setSelectedProductId: (productId: string | null) => void;
  
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  nextTutorialStep: () => void;
  setTutorialStep: (step: number) => void;
  setTutorialActive: (active: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  // Defaults
  isImportModalOpen: false,
  isPlaceProductSheetOpen: false,
  isSettingsOpen: false,
  isQuestOpen: false,
  isFriendListOpen: false,
  
  selectedSlotId: null,
  selectedProductId: null,
  
  soundEnabled: true,
  
  tutorialStep: 0,
  isTutorialActive: false,

  // Setters implementation
  setImportModalOpen: (open) => set({ isImportModalOpen: open }),
  setPlaceProductSheetOpen: (open) => set({ isPlaceProductSheetOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setQuestOpen: (open) => set({ isQuestOpen: open }),
  setFriendListOpen: (open) => set({ isFriendListOpen: open }),
  
  setSelectedSlotId: (slotId) => set({ selectedSlotId: slotId }),
  setSelectedProductId: (productId) => set({ selectedProductId: productId }),
  
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  
  nextTutorialStep: () => set((state) => ({ tutorialStep: state.tutorialStep + 1 })),
  setTutorialStep: (step) => set({ tutorialStep: step }),
  setTutorialActive: (active) => set({ isTutorialActive: active }),
}));
export default useUiStore;
